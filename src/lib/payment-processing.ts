import { db } from "./db";
import { EARLY_BIDDER_THRESHOLD } from "./pricing";

/**
 * Applies a confirmed Dodo Payments payment to the map: creates the claim
 * (first payment on this link+country pair) or atomically raises it (repeat
 * payment on the same link+country), and records the append-only Bid row.
 * Idempotent at the call site — the webhook route only calls this once per
 * unique Dodo event id, and this function itself no-ops if the checkout was
 * already applied.
 *
 * The `currentAmount: { increment }` update compiles to a single atomic
 * `UPDATE ... SET amount = amount + $delta` in Postgres, so two concurrent
 * webhooks raising the *same* claim serialize correctly via the row lock the
 * UPDATE takes — no explicit `SELECT ... FOR UPDATE` needed. Two webhooks
 * for *different* claims never contend at all.
 */
export async function applySucceededCheckoutSession({
  checkoutId,
  dodoPaymentId,
}: {
  checkoutId: string | undefined;
  dodoPaymentId: string;
}) {
  if (!checkoutId) return { applied: false as const, reason: "missing checkoutId in payment metadata" };

  const checkout = await db.checkout.findUnique({ where: { id: checkoutId } });
  if (!checkout) return { applied: false as const, reason: "checkout not found" };
  if (checkout.status === "SUCCEEDED") return { applied: false as const, reason: "already applied" };

  await db.$transaction(async (tx) => {
    const existing = await tx.listing.findUnique({
      where: { normalizedKey_countryId: { normalizedKey: checkout.targetNormalizedKey, countryId: checkout.targetCountryId } },
    });
    // A REMOVED listing is priced as brand-new (see getPricingContext), so
    // it's applied the same way here: reset in place with fresh metadata
    // rather than incremented — the (normalizedKey, countryId) pair is
    // unique, so this reuses the row instead of creating a second one.
    const raisingExisting = existing !== null && existing.status !== "REMOVED";
    let listingId: string;

    if (raisingExisting && existing) {
      const updated = await tx.listing.update({
        where: { id: existing.id },
        data: {
          currentAmount: { increment: checkout.amount },
          raiseCount: { increment: 1 },
          lastPaidAt: new Date(),
          ...(checkout.targetPitch ? { pitch: checkout.targetPitch } : {}),
        },
      });
      listingId = updated.id;
    } else {
      const now = new Date();
      const claimsSoFar = await tx.listing.count();
      const freshData = {
        type: checkout.listingType,
        normalizedKey: checkout.targetNormalizedKey,
        platform: checkout.targetPlatform,
        destinationUrl: checkout.targetDestinationUrl,
        displayName: checkout.targetDisplayName,
        pitch: checkout.targetPitch,
        description: checkout.targetDescription,
        imageUrl: checkout.targetImageUrl,
        faviconUrl: checkout.targetFaviconUrl,
        countryId: checkout.targetCountryId,
        currentAmount: checkout.amount,
        raiseCount: 0,
        early: claimsSoFar < EARLY_BIDDER_THRESHOLD,
        status: "ACTIVE" as const,
        firstPaidAt: now,
        lastPaidAt: now,
      };
      const result = existing ? await tx.listing.update({ where: { id: existing.id }, data: freshData }) : await tx.listing.create({ data: freshData });
      listingId = result.id;

      // First-ever claim on this country, recorded once and never changed —
      // powers the "First to claim N countries" badge on the owner profile.
      await tx.country.updateMany({
        where: { id: checkout.targetCountryId, firstClaimedByNormalizedKey: null },
        data: { firstClaimedByNormalizedKey: checkout.targetNormalizedKey },
      });
    }

    const listing = await tx.listing.findUniqueOrThrow({ where: { id: listingId } });
    await tx.bid.create({
      data: {
        listingId,
        amount: checkout.amount,
        resultingTotal: listing.currentAmount,
        checkoutId: checkout.id,
        createdAt: new Date(),
      },
    });

    await tx.checkout.update({
      where: { id: checkout.id },
      data: { status: "SUCCEEDED", dodoPaymentId },
    });
  });

  return { applied: true as const };
}

export async function markCheckoutFailed(checkoutId: string) {
  await db.checkout
    .updateMany({ where: { id: checkoutId, status: { in: ["INITIATED", "PENDING"] } }, data: { status: "FAILED" } })
    .catch(() => {});
}

export async function flagListingForDispute(dodoPaymentId: string, reason: string) {
  const checkout = await db.checkout.findUnique({ where: { dodoPaymentId } });
  if (!checkout) return;
  const listing = await db.listing.findUnique({
    where: { normalizedKey_countryId: { normalizedKey: checkout.targetNormalizedKey, countryId: checkout.targetCountryId } },
  });
  if (!listing) return;
  await db.moderationFlag.create({ data: { listingId: listing.id, reason } });
}
