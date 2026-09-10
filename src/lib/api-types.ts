/** Client-safe shapes mirroring what the API routes actually serialize (Dates become ISO strings over JSON). */

export type ListingCard = {
  id: string;
  normalizedKey: string;
  platform: string | null;
  destinationUrl: string;
  displayName: string;
  pitch: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
  currentAmount: number;
  early: boolean;
  firstPaidAt: string;
  createdAt: string;
  clicks: number;
};

export type CountryBoardEntry = {
  name: string;
  slug: string;
  priceFloor: number;
  listings: ListingCard[];
};

export type BoardResponse = {
  countries: Record<string, CountryBoardEntry>;
  raised: number;
  activeCountries: number;
};

export type ActivityItem = {
  id: string;
  owner: string;
  normalizedKey: string;
  country: string;
  amount: number;
  resultingTotal: number;
  isNewClaim: boolean;
  createdAt: string;
};

export type ActivityResponse = {
  activity: ActivityItem[];
  /** Real DataFast analytics — null (not zero) whenever DataFast isn't configured or unreachable. */
  watching: number | null;
  visitors: number | null;
};

export type OnlinePing = { city: string | null; region: string | null; countryCode: string | null; lastSeenAt: string };

export type StatsResponse = {
  watching: number | null;
  visitors: number | null;
  online: OnlinePing[];
};

export type WorldOrderEntry = {
  normalizedKey: string;
  displayName: string;
  imageUrl: string | null;
  faviconUrl: string | null;
  destinationUrl: string;
  totalStaked: number;
  countriesPresent: number;
  crowns: number;
  top3Count: number;
  firstClaimAt: string;
  tier: "Sovereign" | "Emperor" | "Conqueror" | "Challenger";
};

export type WorldOrderResponse = {
  tab: "staked" | "crowns" | "early";
  leaderboard: WorldOrderEntry[];
};

export type CheckoutStatusResponse = {
  status: "INITIATED" | "PENDING" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  displayName: string;
  normalizedKey: string;
  amount: number;
  country: { name: string; slug: string } | null;
};
