import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "./db";
import { getDodo } from "./dodo";
import { normalizeSubmission, SubmissionValidationError } from "./normalize-url";
import { getPricingContext, validatePaymentAmount, PricingError } from "./pricing";
import { resolveMetadata } from "./metadata";
import { getSiteUrl } from "./site-url";

export const CheckoutRequestSchema = z.object({
  input: z.string().trim().min(1).max(500),
  countrySlug: z.string().min(1).max(80),
  pitch: z.string().trim().max(140).optional(),
  amount: z.number().int().positive(),
  tosAgreed: z.literal(true),
});

export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;

export class CheckoutRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function createCheckoutSession(input: CheckoutRequest, visitorId: string | null) {
  const country = await db.country.findUnique({ where: { slug: input.countrySlug } });
  if (!country) throw new CheckoutRequestError("Unknown country.", 404);

  let submission;
  try {
    submission = normalizeSubmission(input.input);
  } catch (err) {
    if (err instanceof SubmissionValidationError) throw new CheckoutRequestError(err.message);
    throw err;
  }

  const pricingContext = await getPricingContext(submission.normalizedKey, country.id, country.priceFloor);

  let amount: number;
  try {
    amount = validatePaymentAmount(input.amount, pricingContext);
  } catch (err) {
    if (err instanceof PricingError) throw new CheckoutRequestError(err.message);
    throw err;
  }

  const existingListing =
    pricingContext.existingAmount !== null
      ? await db.listing.findUnique({
          where: { normalizedKey_countryId: { normalizedKey: submission.normalizedKey, countryId: country.id } },
        })
      : null;

  // Only scrape OG metadata for a brand-new claim — a top-up reuses whatever
  // metadata the listing already has, so re-submitting the same link never
  // triggers a redundant fetch of the destination.
  const metadata = existingListing ? null : await resolveMetadata(submission);

  const placeholderSessionId = `pending_${randomBytes(16).toString("hex")}`;
  const checkout = await db.checkout.create({
    data: {
      dodoSessionId: placeholderSessionId,
      visitorId,
      listingType: submission.type,
      targetNormalizedKey: submission.normalizedKey,
      targetPlatform: submission.platform,
      targetDestinationUrl: submission.destinationUrl,
      targetDisplayName: metadata?.displayName ?? existingListing?.displayName ?? submission.displayHint,
      targetPitch: input.pitch || existingListing?.pitch || null,
      targetDescription: metadata?.description ?? existingListing?.description ?? null,
      targetImageUrl: metadata?.imageUrl ?? existingListing?.imageUrl ?? null,
      targetFaviconUrl: metadata?.faviconUrl ?? existingListing?.faviconUrl ?? null,
      targetCountryId: country.id,
      amount,
      status: "INITIATED",
      tosAgreedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const siteUrl = getSiteUrl();

  try {
    const productId = process.env.DODO_PRODUCT_ID;
    if (!productId) {
      throw new Error("DODO_PRODUCT_ID is not set. Add the country-stake product id to .env before using checkout.");
    }

    const dodo = getDodo();
    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1, amount: amount * 100 }],
      return_url: `${siteUrl}/success?checkoutId=${checkout.id}`,
      cancel_url: `${siteUrl}/`,
      metadata: { checkoutId: checkout.id },
    });

    await db.checkout.update({
      where: { id: checkout.id },
      data: { dodoSessionId: session.session_id, status: "PENDING" },
    });

    if (!session.checkout_url) throw new Error("Dodo Payments did not return a checkout URL.");
    return { url: session.checkout_url };
  } catch (err) {
    await db.checkout.update({ where: { id: checkout.id }, data: { status: "FAILED" } }).catch(() => {});
    if (err instanceof CheckoutRequestError) throw err;
    throw new CheckoutRequestError(
      err instanceof Error && (err.message.includes("DODO_PAYMENTS_API_KEY") || err.message.includes("DODO_PRODUCT_ID"))
        ? err.message
        : "Could not start checkout with Dodo Payments. Please try again.",
      502
    );
  }
}
