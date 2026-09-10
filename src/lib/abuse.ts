import { createHash } from "node:crypto";

/**
 * Hashes an IP with a daily-rotating salt: enough to rate-limit/de-duplicate
 * abusive traffic without retaining raw IPs long-term (privacy-by-design,
 * and it makes long-term IP profiling impossible even from a DB dump).
 */
export function hashIp(ip: string): string {
  const daySalt = new Date().toISOString().slice(0, 10);
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev-salt";
  return createHash("sha256").update(`${ip}:${daySalt}:${secret}`).digest("hex");
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "0.0.0.0";
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let callsSinceSweep = 0;

/**
 * In-memory sliding-window rate limiter. Fine for a single dev/small-prod
 * instance; swap for a Redis INCR/EXPIRE limiter once you run more than one
 * process.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  callsSinceSweep += 1;
  if (callsSinceSweep > 5000) {
    callsSinceSweep = 0;
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort geo hint from hosting-platform headers (Vercel) — never fabricated. */
export function getGeoHint(headers: Headers): { city: string | null; region: string | null; countryCode: string | null } {
  return {
    city: headers.get("x-vercel-ip-city") ? decodeURIComponent(headers.get("x-vercel-ip-city")!) : null,
    region: headers.get("x-vercel-ip-country-region"),
    countryCode: headers.get("x-vercel-ip-country"),
  };
}
