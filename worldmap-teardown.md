# worldmap.lol — Reverse-Engineering Teardown

## 1. The product concept

worldmap.lol is a single page ("the globe") showing an interactive 3D world map where every country is a paid advertising slot. Startups/creators "stake" money on a country; the highest cumulative stake for that country wins the #1 spot and shows their name/logo/pitch on the map. It's explicitly framed as **"advertising, not a bet"** (no chance, no payout) — legally positioned to avoid gambling/lottery classification.

Tagline: *"Put your startup on the map. Literally."* — Product Hunt **#5 Product of the Day**.

## 2. Tech stack

- **Framework**: Next.js (App Router). Evidence: `/_next/static/chunks/app/layout-*.js`, `/_next/static/chunks/app/page-*.js`, `/_next/static/chunks/main-app-*.js`, `polyfills-*.js`, `webpack-*.js` — the canonical App Router build output, plus per-deployment `?dpl=dpl_xxxx` query-busting on every chunk.
- **Hosting**: **Vercel** — confirmed via `server: Vercel` and `x-matched-path` / `x-vercel-id` response headers.
- **Rendering**: Hybrid — the homepage globe is a client component (React), but per-owner profile pages (`/pin/<domain>`) appear to be server-rendered (title/rank tags like "Emperor" show up in the raw HTML `<title>` with no matching client bundle string, i.e. computed server-side).
- **Map data**: explicitly disclosed in the "How conquest works" modal — **Natural Earth data via the `world-atlas` npm package** (TopoJSON), the standard dataset for D3/Observable-style globes. The globe itself supports drag-to-spin and scroll-to-zoom (an orthographic/rotatable projection rendered on canvas or SVG).
- **Analytics**: **DataFast** (`datafa.st/js/script.js`) — a lightweight, privacy-oriented analytics tool popular with indie hackers; confirmed by a console log ("DataFast: pageview tracked successfully").
- **Payments**: **Whop**, not Stripe. Confirmed two ways: (1) the checkout modal literally says *"Secure payment via Whop"*; (2) the `/api/activity` feed returns records keyed by `whop_payment_id` (e.g. `pay_fkJ7bgEXT6mFET`). No "stripe" string anywhere in the client bundle. The checkout flow is: client `POST /api/checkout` with `{country, owner, amount, social, visitorId}` → server creates a Whop checkout session → user is redirected to Whop-hosted payment → Whop webhook (server-side, not visible to us) presumably confirms payment and writes the stake to the DB.
- **Visitor identity**: no accounts at all (stated explicitly in the rules). A `visitorId` is generated and persisted in a **cookie** and sent along with the checkout call — used for fraud/attribution, not login.

## 3. Full API surface (all under `worldmap.lol/api/`)

| Route | Purpose |
|---|---|
| `/api/board` | Main data feed. Returns `{countries, winning, raised, activeCountries}` — `countries` is a map of country name → array of all bids for that country (sorted, highest first), each bid has `owner`, `b` (pitch text, nullable), `bid` (dollar amount), `img`, `clicks`, `early` (boolean "early bidder" flag), `created_at`. `winning` is the flattened top bid per country (what actually renders on the globe). `raised` and `activeCountries` are the header stats ("$1,885 in bids", "112 countries live"). |
| `/api/activity` | Live sidebar feed: recent payments (`whop_payment_id`, `country`, `owner`, `amount`, `created_at`) plus `watching` (concurrent viewer count) and `visitors72h`. |
| `/api/stats` | `{watching, visitors72h, online:[{flag, city, country, ago}]}` — powers the "Someone in `<city>` is online" ticker. City-level data implies server-side IP geolocation (Vercel geo headers or DataFast), not browser geolocation — no permission prompt is ever shown. |
| `/api/checkout` | `POST` — starts a Whop checkout session. Body: `{country, owner, amount, social, visitorId}`. |
| `/api/click` | Click-through tracking. Fired via `navigator.sendBeacon('/api/click', new Blob([JSON.stringify({owner})], {type:'application/json'}))` whenever a visitor clicks an outbound listing link — this is what powers the "672 clicks" counters on the leaderboard. |
| `/api/icon` | Server-side favicon proxy, e.g. `/api/icon?domain=vignette.id&strict=1` → returns `image/x-icon`. Used as one link in a client-side fallback chain. |
| `/api/og` | Dynamic OG-image generator for the site's own social share cards (separate from the default `/og2.png`). |

### Favicon fallback chain
For each listing's logo, the client tries, in order (with an `onError` handler that increments an index into an array of candidate URLs, showing a placeholder "logo-ph" div with the first-letter initial if all fail):
1. `icons.duckduckgo.com/ip3/<domain>.ico`
2. `unavatar.io/<domain>?fallback=false`
3. `worldmap.lol/api/icon?domain=<domain>&strict=1` (their own proxy)
4. `google.com/s2/favicons?domain=<domain>&sz=128`
5. `t{0-3}.gstatic.com/faviconV2?...&url=<domain>&size=128`

Country-card preview images (`img` field) are **not proxied** — they link directly to the target site's own `/opengraph-image` route or an uploaded asset, e.g. `https://the100kdatabase.com/opengraph-image?52530aab3cc755a3`. This implies worldmap.lol scrapes/resolves each submitted URL's OG image server-side at listing time and caches the resolved URL (the trailing hex string looks like a cache-busting hash).

## 4. The staking / ranking mechanic

This is the core game design, spelled out in the "How conquest works" modal and the `/rules` page:

1. **Claim** — plant a flag on any empty country from **$5**.
2. **Stake to climb** — your rank on a country is your **cumulative total stake**, not your last payment. Highest total wins #1.
3. **Reclaim anytime** — if outbid, topping up only costs the **difference** needed to pass the current #1 (minimum $5 per payment); your prior stake is never lost or refunded.
4. **No accounts** — a listing is identified purely by its submitted link. Adding more stake means resubmitting the *exact same* link in the *same* mode (Product URL vs. Social profile); a different link is a brand-new, separate listing.
5. **Ties** go to whoever staked first.
6. **One hidden country** has a lower price floor than $5 — an undisclosed easter egg.
7. **Link normalization**: product URLs are reduced to bare domain (path and query strings, including UTM/affiliate params, are stripped) so `site.com/page?utm=x` and `site.com` are the same listing and referral/affiliate tracking links are neutered. No redirects allowed — if a submitted link redirects, they may swap it for the final destination or remove it.
8. **Allowed listing types**: a product URL, or a social profile (X/Twitter, Instagram, GitHub, YouTube channel — not individual posts/videos). Chat/invite links (Telegram, WhatsApp, Discord, Signal) are explicitly banned — confirmed by a hard-coded domain blocklist/allowlist array found in the bundle (`t.me`, `wa.me`, `discord.gg`, `signal.me`, `m.me`, `x.com`, `instagram.com`, `github.com`, `apps.apple.com`, etc.) used to detect link type and pick the right platform icon.
9. **All sales final** — explicitly "not a bet," no refunds, no payouts, no chargebacks (they ask you to email first). Payments processed by Whop, whose own terms also apply.
10. Moderation is at their sole discretion; scam/illegal/adult content can be removed without refund, adult content gets a disclaimer + hidden preview.

## 5. Gamification layer

- **Crowns** = number of countries where a listing currently holds #1.
- **"World Order" leaderboard** ("🏆" icon) — global Top 10 by total dollars staked across all countries, with a tab distinction in code for `crowns` vs `early` metrics (`y = {crowns: {...}, early: {...}}`), i.e. there's an alternate ranking by early-bidder status, though only the spend-based view is exposed on the homepage widget. The expanded modal (via the "⤢" expand icon) shows full descriptions and click counts per entrant.
- **Per-owner shareable profile pages** at `worldmap.lol/pin/<domain>` (or `/pin/<@handle>` for socials) — a personal "trading card" with a mini-globe of just that owner's territories, a title/rank badge, and stat badges: crown count, "First to claim N countries," "Top-3 claimer ×N," "Present in N countries," total staked, plus a grid of countries/#1 spots/placements/clicks. Every listing gets one of these automatically (mentioned in the rules: "Every listing gets its own shareable page").
- **Title tiers** (shown next to the owner name, e.g. `vignette.id · Emperor`) appear to follow a thematic rule based on breadth and dominance rather than a flat dollar threshold:
  - **Sovereign** — holds #1 in exactly one country (sole ruler of a single territory) — regardless of dollar amount (seen at $5 and at $106).
  - **Emperor** — holds #1 in multiple countries (even if not 100% of the countries they're in).
  - **Conqueror** — present in multiple countries but with a lower #1 ratio/count.
  - **Challenger** — present in exactly one country but not currently #1 in it.
  - (An edge case — a very low-stake #2 spot — sometimes renders with no tier suffix at all, suggesting a data-completeness guard rather than a fifth tier.)
- Top-of-map floating badges (separate from the country-fill color) mark specific high-value pins, e.g. a "👑 $50" badge and a "🧊 $500" badge seen floating over specific coordinates — these look like special "high-value plot" markers layered on top of the base choropleth, distinct from the leaderboard.

## 6. Visual design details

- Each country polygon is filled with a color from a small pastel palette (`#4f76a0, #E1D8F2, #735fa0, #D8EBDD, #4f8a63, #F5DAD9, #a85f5c, ...`), assigned per-country independently of bid amount — purely for visual variety/legibility, not data-encoding. Unclaimed countries render in a muted grey.
- Country cards / floating labels are attached to lat/long anchor points on the polygons and re-projected every frame as the globe rotates (canvas-based, since it's "drag to spin / scroll to zoom" rather than fixed SVG panning).
- "Live activity" panel: a rolling feed of `{owner, country, amount, ago}` from `/api/activity`, plus a "Someone in `<city>` is online" ticker and `visitors72h` / `watching` counters from `/api/stats` — all derived server-side (IP geo + concurrent-connection counting), no client geolocation permission is ever requested.

## 7. Business/legal notes

- Contact email: **contact@openvoice.space** — suggests the operator's umbrella brand/company is "Openvoice" (or that's simply their support inbox domain), separate from the worldmap.lol product domain itself.
- Explicit non-affiliation disclaimer: anyone can list any public link, including ones they don't own; a listing appearing is not proof of endorsement or of company involvement — clearly written to preempt trademark/impersonation complaints.
- Pricing floor is a flat **$5 minimum per payment**, in whole US dollars only.

## 8. Summary of the stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Payments | Whop (checkout + payment IDs), not Stripe |
| Map data | Natural Earth via `world-atlas` (TopoJSON) |
| Analytics | DataFast |
| Identity | Cookie-based `visitorId`, no user accounts |
| Data API | Custom REST-ish routes under `/api/*` (board, activity, stats, checkout, click, icon, og), polled on an interval rather than pushed via WebSocket/SSE |
| Icons | Cascading fallback across DuckDuckGo, unavatar.io, Google favicons, gstatic, and an in-house `/api/icon` proxy |
