import type { Metadata } from "next";
import { DocumentShell } from "@/components/DocumentShell";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <DocumentShell>
      <h1>Privacy</h1>
      <p>
        <em>This is a draft template, not reviewed legal advice — have a lawyer look it over before taking real money.</em>
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>An anonymous visitor id, stored in a cookie, so we can tell repeat visits apart from new ones — no account or personal profile is tied to it.</li>
        <li>The link, pitch, and stake amount you submit when you claim or raise a listing.</li>
        <li>Basic request metadata (a hashed IP, user agent, referrer) used only for rate-limiting and fraud prevention. IPs are hashed with a salt that rotates daily and are never stored in raw form.</li>
        <li>Approximate location (city/region/country) when our hosting platform provides it, used only to power the &quot;online now&quot; indicator — never your precise location, and never collected via a browser permission prompt.</li>
        <li>Payment details are collected and processed entirely by Dodo Payments. We never see or store your card number.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t sell your data. We don&apos;t fabricate visitor counts or activity — every number shown on {siteConfig.name} is derived from real, logged events.</p>

      <h2>Retention</h2>
      <p>Listing, payment, and click records are kept indefinitely, since the map itself is meant to be a permanent public record. Presence/visitor rows are used only for live counters and aren&apos;t retained as a long-term profile.</p>

      <h2>Contact</h2>
      <p>Questions about this policy — see the contact details on the About page.</p>
    </DocumentShell>
  );
}
