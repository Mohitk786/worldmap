import type { Metadata } from "next";
import { DocumentShell } from "@/components/DocumentShell";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <DocumentShell>
      <h1>Terms of service</h1>
      <p>
        <em>This is a draft template, not reviewed legal advice — have a lawyer look it over before taking real money.</em>
      </p>

      <h2>What this is</h2>
      <p>{siteConfig.name} sells advertising placements on a public, interactive map. Paying to place a listing does not create any ownership, endorsement, partnership, or exclusivity beyond a visual placement on the map for as long as your stake holds the position, subject to these terms.</p>

      <h2>No refunds</h2>
      <p>All payments are final. We don&apos;t offer refunds, exchanges, or payouts for any reason, including if your listing is later outstaked, put under review, or removed for violating these terms.</p>

      <h2>Acceptable listings</h2>
      <p>You may only submit links you have the right to advertise. We prohibit illegal content, fraud, malware, chat/invite links, and impersonation. We may remove a listing or place it under review at our sole discretion, without refund.</p>

      <h2>No affiliation implied</h2>
      <p>Anyone can submit a public link, including one they don&apos;t own or operate. A listing&apos;s presence on the map is not an endorsement of, or affiliation with, the linked site or its operator, and does not imply the operator submitted or is aware of the listing.</p>

      <h2>Payments</h2>
      <p>Payments are processed by Dodo Payments. Their terms apply to the payment itself in addition to these terms.</p>

      <h2>Limitation of liability</h2>
      <p>The map is provided as-is. We&apos;re not liable for indirect, incidental, or consequential damages arising from your use of the site, to the maximum extent the law allows.</p>

      <h2>Changes</h2>
      <p>We may update these terms as the product changes. Continued use after a change means you accept the new terms.</p>
    </DocumentShell>
  );
}
