import { db } from "./db";
import { computeTier } from "./titles";

const LISTINGS_PER_COUNTRY_CAP = 50;

async function attachClickCounts<T extends { id: string }>(rows: T[]): Promise<(T & { clicks: number })[]> {
  if (rows.length === 0) return [];
  const counts = await db.click.groupBy({
    by: ["listingId"],
    where: { listingId: { in: rows.map((r) => r.id) }, isCounted: true },
    _count: { _all: true },
  });
  const map = new Map(counts.map((c) => [c.listingId, c._count._all]));
  return rows.map((r) => ({ ...r, clicks: map.get(r.id) ?? 0 }));
}

const listingCardSelect = {
  id: true,
  normalizedKey: true,
  platform: true,
  destinationUrl: true,
  displayName: true,
  pitch: true,
  imageUrl: true,
  faviconUrl: true,
  currentAmount: true,
  early: true,
  firstPaidAt: true,
  createdAt: true,
} as const;

/** Every claimed country's full bid stack (highest first) — powers the globe + the per-country panel. */
export async function getFullBoard() {
  const countries = await db.country.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, priceFloor: true } });
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ currentAmount: "desc" }, { firstPaidAt: "asc" }],
    select: { ...listingCardSelect, countryId: true },
  });
  const withClicks = await attachClickCounts(listings);

  const byCountry = new Map<string, typeof withClicks>();
  for (const listing of withClicks) {
    const bucket = byCountry.get(listing.countryId);
    if (bucket) bucket.push(listing);
    else byCountry.set(listing.countryId, [listing]);
  }

  const result: Record<string, { name: string; slug: string; priceFloor: number; listings: Omit<(typeof withClicks)[number], "countryId">[] }> = {};
  let raised = 0;
  let activeCountries = 0;
  for (const country of countries) {
    const forCountry = (byCountry.get(country.id) ?? []).slice(0, LISTINGS_PER_COUNTRY_CAP);
    if (forCountry.length > 0) activeCountries += 1;
    for (const l of forCountry) raised += l.currentAmount;
    result[country.name] = {
      name: country.name,
      slug: country.slug,
      priceFloor: country.priceFloor,
      listings: forCountry.map((l) => ({
        id: l.id,
        normalizedKey: l.normalizedKey,
        platform: l.platform,
        destinationUrl: l.destinationUrl,
        displayName: l.displayName,
        pitch: l.pitch,
        imageUrl: l.imageUrl,
        faviconUrl: l.faviconUrl,
        currentAmount: l.currentAmount,
        early: l.early,
        firstPaidAt: l.firstPaidAt,
        createdAt: l.createdAt,
        clicks: l.clicks,
      })),
    };
  }

  return { countries: result, raised, activeCountries };
}

export async function getLatestActivity(limit = 12) {
  const bids = await db.bid.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { listing: { include: { country: { select: { name: true } } } } },
  });
  return bids
    .filter((b) => b.listing.status === "ACTIVE")
    .map((b) => ({
      id: b.id,
      owner: b.listing.displayName,
      normalizedKey: b.listing.normalizedKey,
      country: b.listing.country.name,
      amount: b.amount,
      resultingTotal: b.resultingTotal,
      isNewClaim: b.resultingTotal === b.amount,
      createdAt: b.createdAt,
    }));
}

type OwnerAggregate = {
  normalizedKey: string;
  displayName: string;
  imageUrl: string | null;
  faviconUrl: string | null;
  destinationUrl: string;
  totalStaked: number;
  countriesPresent: number;
  crowns: number;
  top3Count: number;
  firstClaimAt: Date;
};

async function aggregateOwners(): Promise<Map<string, OwnerAggregate>> {
  const listings = await db.listing.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ currentAmount: "desc" }, { firstPaidAt: "asc" }],
    select: {
      normalizedKey: true,
      displayName: true,
      imageUrl: true,
      faviconUrl: true,
      destinationUrl: true,
      currentAmount: true,
      countryId: true,
      firstPaidAt: true,
    },
  });

  const byCountry = new Map<string, typeof listings>();
  for (const l of listings) {
    const bucket = byCountry.get(l.countryId);
    if (bucket) bucket.push(l);
    else byCountry.set(l.countryId, [l]);
  }

  const owners = new Map<string, OwnerAggregate>();
  for (const [, countryListings] of byCountry) {
    // Already sorted desc by currentAmount/firstPaidAt from the query above.
    countryListings.forEach((l, rank) => {
      const existing = owners.get(l.normalizedKey);
      if (existing) {
        existing.totalStaked += l.currentAmount;
        existing.countriesPresent += 1;
        if (rank === 0) existing.crowns += 1;
        if (rank < 3) existing.top3Count += 1;
        if (l.firstPaidAt < existing.firstClaimAt) existing.firstClaimAt = l.firstPaidAt;
      } else {
        owners.set(l.normalizedKey, {
          normalizedKey: l.normalizedKey,
          displayName: l.displayName,
          imageUrl: l.imageUrl,
          faviconUrl: l.faviconUrl,
          destinationUrl: l.destinationUrl,
          totalStaked: l.currentAmount,
          countriesPresent: 1,
          crowns: rank === 0 ? 1 : 0,
          top3Count: rank < 3 ? 1 : 0,
          firstClaimAt: l.firstPaidAt,
        });
      }
    });
  }
  return owners;
}

export async function getWorldOrderLeaderboard(tab: "staked" | "crowns" | "early" = "staked", limit = 10) {
  const owners = Array.from((await aggregateOwners()).values());

  if (tab === "early") {
    const earlyKeys = new Set(
      (
        await db.listing.findMany({ where: { status: "ACTIVE", early: true }, select: { normalizedKey: true } })
      ).map((l) => l.normalizedKey)
    );
    return owners
      .filter((o) => earlyKeys.has(o.normalizedKey))
      .sort((a, b) => a.firstClaimAt.getTime() - b.firstClaimAt.getTime())
      .slice(0, limit)
      .map((o) => ({ ...o, tier: computeTier(o.crowns, o.countriesPresent) }));
  }

  const sortKey = tab === "crowns" ? ("crowns" as const) : ("totalStaked" as const);
  return owners
    .sort((a, b) => b[sortKey] - a[sortKey] || b.totalStaked - a.totalStaked)
    .slice(0, limit)
    .map((o) => ({ ...o, tier: computeTier(o.crowns, o.countriesPresent) }));
}

export async function getOwnerProfile(normalizedKey: string) {
  const listings = await db.listing.findMany({
    where: { normalizedKey, status: "ACTIVE" },
    include: { country: { select: { name: true, slug: true } } },
    orderBy: { currentAmount: "desc" },
  });
  if (listings.length === 0) return null;

  const withClicks = await attachClickCounts(listings);

  const rows = await Promise.all(
    withClicks.map(async (listing) => {
      const better = await db.listing.count({
        where: {
          countryId: listing.countryId,
          status: "ACTIVE",
          OR: [
            { currentAmount: { gt: listing.currentAmount } },
            { currentAmount: listing.currentAmount, firstPaidAt: { lt: listing.firstPaidAt } },
          ],
        },
      });
      return { ...listing, rank: better + 1 };
    })
  );

  const owners = await aggregateOwners();
  const aggregate = owners.get(normalizedKey);
  const crowns = rows.filter((r) => r.rank === 1).length;
  const top3Count = rows.filter((r) => r.rank <= 3).length;
  const firstToClaimCount = await db.country.count({ where: { firstClaimedByNormalizedKey: normalizedKey } });
  const totalStaked = aggregate?.totalStaked ?? rows.reduce((sum, r) => sum + r.currentAmount, 0);

  const richest = rows[0]!;
  return {
    normalizedKey,
    displayName: richest.displayName,
    imageUrl: rows.find((r) => r.imageUrl)?.imageUrl ?? null,
    faviconUrl: richest.faviconUrl,
    destinationUrl: richest.destinationUrl,
    tier: computeTier(crowns, rows.length),
    crowns,
    top3Count,
    firstToClaimCount,
    countriesPresent: rows.length,
    totalStaked,
    isEarly: rows.some((r) => r.early),
    countries: rows.map((r) => ({
      country: r.country.name,
      countrySlug: r.country.slug,
      amount: r.currentAmount,
      rank: r.rank,
      pitch: r.pitch,
      clicks: r.clicks,
      raiseCount: r.raiseCount,
    })),
  };
}

export async function getSiteTotals() {
  const [raisedAgg, activeCountries, totalClaims] = await Promise.all([
    db.bid.aggregate({ _sum: { amount: true } }),
    db.listing.groupBy({ by: ["countryId"], where: { status: "ACTIVE" } }).then((r) => r.length),
    db.listing.count({ where: { status: "ACTIVE" } }),
  ]);
  return {
    raised: raisedAgg._sum.amount ?? 0,
    activeCountries,
    totalClaims,
  };
}
