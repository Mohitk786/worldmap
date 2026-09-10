# WorldMap

A public, permanent 3D globe where every country is a paid advertising slot. Stake money to claim a country — highest cumulative stake wins the spot. It's advertising, not a bet: fixed prices, no chance, no payout. A from-scratch rebuild of the worldmap.lol mechanic (see `worldmap-teardown.md` for the reverse-engineering notes this was built from), not a copy of its code or assets.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript, strict mode
- **Prisma 7** (`@prisma/adapter-pg` driver-adapter pattern) + Postgres 17 in its own Docker container
- **Tailwind v4** (CSS-first `@theme` config)
- **Dodo Payments** test-mode checkout + webhook for the actual money movement
- **react-globe.gl** (three.js) rendering the globe, with country polygons from `world-atlas` (Natural Earth data via the `world-atlas` npm package, TopoJSON) — the same data source the original site discloses using

## Brand

Everything reads from one place: `src/lib/site-config.ts` (backed by `NEXT_PUBLIC_SITE_NAME` / `NEXT_PUBLIC_SITE_TAGLINE` in `.env`). Change the name there and it updates the header, page titles, OG metadata, and copy across every page — nothing else to touch.

## Local setup

```bash
npm install
docker run -d --name worldmap-postgres -e POSTGRES_USER=worldmap -e POSTGRES_PASSWORD=worldmap -e POSTGRES_DB=worldmap -p 5470:5432 postgres:17
cp .env.example .env   # already pre-filled for the container above; edit as needed
npx prisma migrate dev
npm run db:seed        # seeds all ~177 countries from world-atlas
npm run dev
```

To actually run a payment end-to-end, add Dodo Payments **test-mode** credentials to `.env`:

1. `DODO_PAYMENTS_API_KEY` — Dashboard → Developer → API Keys.
2. Create a one-time product with dynamic/custom pricing ("country stake") and put its id in `DODO_PRODUCT_ID`.
3. Create a webhook endpoint pointing at `<your-url>/api/webhooks/dodo`, and put its signing secret in `DODO_PAYMENTS_WEBHOOK_SECRET`.

Without those three set, the map, globe, leaderboard, and admin panel all work — only the final "Pay with Dodo" step will show a clear error telling you what's missing.

## The mechanic, in code terms

- A **claim** (`Listing`) is keyed by `(normalizedKey, countryId)` — the same link can hold a completely independent stake in as many countries as it wants, which is what lets one owner collect multiple crowns.
- Every payment is charged in full and added straight onto that pair's cumulative `currentAmount` — there's no "raise to a target" math, just a per-country minimum (`Country.priceFloor`, normally $5). Ties break by whoever staked first (`firstPaidAt`).
- One country has a lower, undisclosed price floor (the "hidden country" easter egg from the original site) — see the comment in `prisma/seed.ts` for which one; it's never named in the UI or rules copy.
- Titles (`src/lib/titles.ts`): **Sovereign** (sole #1, one country), **Challenger** (present, not #1, one country), **Emperor** (#1 in 2+ countries), **Conqueror** (present in 2+ countries, at most one crown).

## Honesty about live numbers

Nothing on this site fabricates activity. The header's "N watching now" badge is real DataFast analytics (`src/lib/datafast.ts`) — the same analytics provider the original worldmap.lol site uses. Set `DATAFAST_API_KEY` (Website Settings → API tab at datafa.st) to turn it on; leave it unset and the badge just doesn't render, it never falls back to a made-up number. The "online in `<city>`" ticker is separate — it's a real per-visitor heartbeat (`src/lib/presence.ts`) rather than DataFast, since DataFast's realtime/overview endpoints don't return a per-city breakdown; it only ever shows a city when the hosting platform's own geo headers (Vercel's `x-vercel-ip-city`, etc.) provide one — in local dev, or on a non-Vercel host, it's simply empty rather than made up.

## Demo data

The dev database currently has a handful of seeded demo claims (France/USA/Brazil/Japan) so the globe, leaderboard, and pin pages have something to show. They're plain rows in Postgres — clear them before a real launch with:

```sql
TRUNCATE "Bid", "Checkout", "Click", "Listing" CASCADE;
UPDATE "Country" SET "firstClaimedByNormalizedKey" = NULL;
```

## Known gaps

- **Terms/Privacy are drafts** — real legal review is needed before taking real money (flagged inline on both pages).
- **Rate limiting is in-memory** — fine for a single instance; move to Redis if you scale beyond one process.
- **Admin auth is a single shared password** — fine for a solo operator, not for a team.
- **Metadata scraping** (`src/lib/metadata.ts`) only runs for brand-new product-URL claims (SSRF-guarded via `safe-fetch.ts`); social profiles use the handle as the display name since those platforms block naive scraping.
# worldmap
