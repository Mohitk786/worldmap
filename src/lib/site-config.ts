/**
 * Single source of truth for the brand. Every page title, the header/footer,
 * OG images, and the Dodo return URLs all read from here (or from the env
 * vars this falls back to) — rebrand the whole app by changing these three
 * lines, nothing else.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "WorldMap",
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Claim a country. Literally.",
  description:
    "A public, permanent map where every country is a paid advertising slot. Stake to claim it — highest total stake wins the spot. Advertising, not a bet: no chance, no payout.",
} as const;
