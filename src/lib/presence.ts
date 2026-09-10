import { db } from "./db";

const WATCHING_WINDOW_MS = 2 * 60 * 1000;
const VISITORS_WINDOW_MS = 72 * 60 * 60 * 1000;

export type GeoHint = { city: string | null; region: string | null; countryCode: string | null };

/**
 * Upserts a real heartbeat row per visitor cookie. This is the only source
 * for "watching" / "visitors in 72h" / the "online in <city>" ticker — there
 * is no fabricated presence counter anywhere in this app. When the hosting
 * platform doesn't supply geo headers (local dev, non-Vercel hosts), city
 * stays null and that visitor simply never appears in the city ticker; the
 * counts themselves are still real.
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

export async function getPresenceStats() {
  const now = Date.now();
  const [watching, visitors72h, recentWithCity] = await Promise.all([
    db.visitor.count({ where: { lastSeenAt: { gte: new Date(now - WATCHING_WINDOW_MS) } } }),
    db.visitor.count({ where: { lastSeenAt: { gte: new Date(now - VISITORS_WINDOW_MS) } } }),
    db.visitor.findMany({
      where: { city: { not: null }, lastSeenAt: { gte: new Date(now - VISITORS_WINDOW_MS) } },
      orderBy: { lastSeenAt: "desc" },
      take: 5,
      select: { city: true, region: true, countryCode: true, lastSeenAt: true },
    }),
  ]);

  return {
    watching,
    visitors72h,
    online: recentWithCity.map((v) => ({ city: v.city, region: v.region, countryCode: v.countryCode, lastSeenAt: v.lastSeenAt })),
  };
}
