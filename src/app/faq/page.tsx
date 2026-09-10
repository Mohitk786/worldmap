import type { Metadata } from "next";
import { DocumentShell } from "@/components/DocumentShell";
import { DEFAULT_PRICE_FLOOR } from "@/lib/pricing";
import { formatUsd } from "@/lib/format";

export const metadata: Metadata = { title: "FAQ" };

const FAQS: [string, string][] = [
  ["Is this gambling?", "No. There's no chance involved and no payout — you pay a fixed, known price for a placement. It's advertising."],
  ["What happens if I get outstaked?", `Your link stays up, just lower down. Your money is never refunded or removed — it's added to a running total, and you can top it up any time from ${formatUsd(DEFAULT_PRICE_FLOOR)}.`],
  ["Can I claim the same country twice with different links?", "Yes — each link gets its own independent claim on a country. They don't combine."],
  ["Can I claim the same link in multiple countries?", "Yes. The same link can hold a separate stake in every country you claim — that's how you collect crowns."],
  ["Do I need an account?", "No. Your claim is identified by the link you submit. Keep the link the same to add to it later."],
  ["Can I get a refund?", "No — all sales are final, per the rules and Dodo Payments' own terms. Email us before disputing a charge with your bank."],
  ["Who can be listed?", "Anyone can submit any public link, including ones they don't own. A listing appearing here isn't an endorsement by, or affiliation with, the linked site."],
];

export default function FaqPage() {
  return (
    <DocumentShell>
      <h1>Frequently asked</h1>
      {FAQS.map(([q, a]) => (
        <div key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </div>
      ))}
    </DocumentShell>
  );
}
