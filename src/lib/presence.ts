import { db } from "./db";

const RECENT_WINDOW_MS = 72 * 60 * 60 * 1000;

export type GeoHint = { city: string | null; region: string | null; countryCode: string | null };

/**
 * Upserts a real heartbeat row per visitor cookie. The aggregate "watching
 * now" / total-visitor numbers come from DataFast (see datafast.ts) — this
 * table exists only to power the "online in <city>" ticker, which needs a
 * per-visitor city breakdown DataFast's simple realtime/overview endpoints
 * don't provide. When the hosting platform doesn't supply geo headers
 * (local dev, non-Vercel hosts), city stays null and that visitor simply
 * never appears in the ticker.
 */
export async function recordPresence(visitorId: string, geo: GeoHint): Promise<void> {
  const now = new Date();
  await db.visitor.upsert({
    where: { visitorId },
    create: { visitorId, city: geo.city, region: geo.region, countryCode: geo.countryCode, firstSeenAt: now, lastSeenAt: now },
    update: {
      lastSeenAt: now,
      ...(geo.city ? { city: geo.city, region: geo.region, countryCode: geo.countryCode } : {}),
    },
  });
}

export async function getOnlineCities(limit = 5) {
  const recentWithCity = await db.visitor.findMany({
    where: { city: { not: null }, lastSeenAt: { gte: new Date(Date.now() - RECENT_WINDOW_MS) } },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
    select: { city: true, region: true, countryCode: true, lastSeenAt: true },
  });
  return recentWithCity.map((v) => ({ city: v.city, region: v.region, countryCode: v.countryCode, lastSeenAt: v.lastSeenAt }));
}
