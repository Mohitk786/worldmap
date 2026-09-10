import type { Metadata } from "next";
import { DocumentShell } from "@/components/DocumentShell";
import { DEFAULT_PRICE_FLOOR, EARLY_BIDDER_THRESHOLD } from "@/lib/pricing";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <DocumentShell>
      <h1>How claiming works</h1>
      <p>This is advertising, not a bet. There&apos;s no chance involved and no payout — you&apos;re paying to put your link in front of everyone who visits the map. Every sale is final.</p>

      <h2>1. Claim a country</h2>
      <p>Pick any unclaimed country and stake money on it, starting at {formatUsd(DEFAULT_PRICE_FLOOR)}. Your stake attaches to one link — a product URL or a social profile — and shows your name, an optional one-line pitch, and a link out.</p>

      <h2>2. Rank is your total stake</h2>
      <p>Your position on a country is your cumulative stake there, not your most recent payment. Whoever has staked the most on a given country holds #1 on it. Ties go to whoever staked first.</p>

      <h2>3. Top up anytime</h2>
      <p>If someone outstakes you, you can add more at any time — every payment adds to your running total on that country, it&apos;s never lost or refunded. There&apos;s a {formatUsd(DEFAULT_PRICE_FLOOR)} minimum per payment (one country has a lower floor — it&apos;s not listed anywhere, you&apos;ll have to find it).</p>

      <h2>4. One link, one identity</h2>
      <p>There are no accounts. A claim is identified purely by the link you submit. Adding more stake means resubmitting the exact same link, in the same mode (product URL or social profile) — a different link is a brand-new, separate claim. The same link can hold completely independent claims in as many different countries as you want.</p>

      <h2>5. What you can list</h2>
      <p>A product URL, or a social profile — X/Twitter, Instagram, GitHub, or a YouTube channel (the profile itself, not an individual post or video). Product URLs are reduced to their bare domain, so tracking parameters and specific pages don&apos;t matter — <span className="tabular">site.com/page?utm=x</span> and <span className="tabular">site.com</span> are the same claim.</p>
      <p>Chat and invite links (Telegram, WhatsApp, Discord, Signal, Messenger) aren&apos;t accepted. Neither is adult content, or anything illegal or fraudulent.</p>

      <h2>6. Moderation</h2>
      <p>Claims can be put under review or removed at our discretion — a removed claim&apos;s money isn&apos;t refunded, and the country becomes claimable again from scratch. Report a claim by emailing us.</p>

      <h2>7. Titles</h2>
      <p>Hold #1 on one country and you&apos;re a Sovereign. Present in one country but not #1 there, you&apos;re a Challenger. Hold #1 on more than one country and you&apos;re an Emperor. Present in several countries with at most one crown, you&apos;re a Conqueror. The first {EARLY_BIDDER_THRESHOLD} claims on the whole map get a permanent founder&apos;s badge.</p>

      <h2>8. Payments</h2>
      <p>Handled by Dodo Payments. We never see or store your card details. All sales are final — no refunds, no chargebacks. Email us before disputing a charge with your bank.</p>
    </DocumentShell>
  );
}
