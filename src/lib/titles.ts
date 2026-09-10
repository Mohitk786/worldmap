export type Tier = "Sovereign" | "Emperor" | "Conqueror" | "Challenger";

/**
 * Title tiers are about breadth + dominance, not raw dollars (a $5 Sovereign
 * and a $106 Sovereign are both just "sole ruler of one territory"):
 * - Sovereign  — #1 in exactly the one country they're present in.
 * - Challenger — present in exactly one country, but not #1 there.
 * - Emperor    — #1 in multiple countries (need not be all of them).
 * - Conqueror  — present in multiple countries, but #1 in at most one.
 */
export function computeTier(crowns: number, countriesPresent: number): Tier {
  if (countriesPresent <= 1) return crowns >= 1 ? "Sovereign" : "Challenger";
  return crowns >= 2 ? "Emperor" : "Conqueror";
}
