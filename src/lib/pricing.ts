import { db } from "./db";

export const DEFAULT_PRICE_FLOOR = 5;
export const MAX_AMOUNT = 999_999;
/** First N claims placed on the whole map ever get the "early" badge. */
export const EARLY_BIDDER_THRESHOLD = 100;

export class PricingError extends Error {}

export type PricingContext = {
  existingAmount: number | null;
  currentTopAmount: number;
  priceFloor: number;
};

/**
 * Unlike a "raise to a target" model, every payment here is charged in full
 * and added straight onto the cumulative stake — so pricing only needs the
 * current #1 (to power the "take #1 for $X" suggestion) and this owner's
 * existing stake on this specific country, if any.
 */
export async function getPricingContext(normalizedKey: string, countryId: string, priceFloor: number): Promise<PricingContext> {
  const [existing, top] = await Promise.all([
    db.listing.findFirst({
      where: { normalizedKey, countryId, status: { not: "REMOVED" } },
      select: { currentAmount: true },
    }),
    db.listing.findFirst({
      where: { countryId, status: "ACTIVE" },
      orderBy: [{ currentAmount: "desc" }, { firstPaidAt: "asc" }],
      select: { currentAmount: true },
    }),
  ]);

  return {
    existingAmount: existing?.currentAmount ?? null,
    currentTopAmount: top?.currentAmount ?? 0,
    priceFloor,
  };
}

/**
 * Validates a buyer-submitted payment amount. Never trust a client-submitted
 * amount as final — this is always re-validated server-side at
 * checkout-creation time against the live DB, not from anything the client
 * asserts. There's no "must overtake #1" requirement: any payment at or
 * above the country's floor is accepted and simply adds to the owner's
 * cumulative stake on that country.
 */
export function validatePaymentAmount(amount: number, ctx: PricingContext): number {
  if (!Number.isInteger(amount)) {
    throw new PricingError("Amounts are whole US dollars only.");
  }
  if (amount > MAX_AMOUNT) {
    throw new PricingError(`The maximum is $${MAX_AMOUNT.toLocaleString()}.`);
  }
  if (amount < ctx.priceFloor) {
    throw new PricingError(`The minimum payment here is $${ctx.priceFloor.toLocaleString()}.`);
  }
  return amount;
}

/** Purely a UI suggestion (the "Take #1 for $X" CTA) — never enforced server-side. */
export function amountToTakeFirst(ctx: PricingContext): number | null {
  const existingTotal = ctx.existingAmount ?? 0;
  if (existingTotal > ctx.currentTopAmount) return null;
  const needed = ctx.currentTopAmount - existingTotal + 1;
  return Math.max(needed, ctx.priceFloor);
}
