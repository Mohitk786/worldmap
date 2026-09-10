/**
 * Resolves the site's own base URL, in priority order:
 * 1. NEXT_PUBLIC_SITE_URL — explicit override, e.g. for a custom domain.
 * 2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain,
 *    auto-set on every deploy with no configuration needed.
 * 3. VERCEL_URL — the current deployment's own URL (covers preview deploys).
 * 4. localhost, for local dev.
 *
 * Exists so Dodo Payments redirect URLs, the sitemap, and share links never
 * silently fall back to localhost in production just because someone forgot
 * to set NEXT_PUBLIC_SITE_URL before a build — Vercel's own env vars self-heal
 * this.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}
