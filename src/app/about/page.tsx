import type { Metadata } from "next";
import { DocumentShell } from "@/components/DocumentShell";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "About" };

const CONTACT_EMAIL = `hello@${siteConfig.name.toLowerCase().replace(/\s+/g, "")}.example`;

export default function AboutPage() {
  return (
    <DocumentShell>
      <h1>About {siteConfig.name}</h1>
      <p>{siteConfig.name} is a public, permanent map where every country is a paid advertising slot. Stake money on a country and your link goes up — highest total stake holds the spot.</p>
      <p>There&apos;s no chance involved, nothing to win beyond the attention, and no accounts to sign up for. Just a link, a pitch, and a stake.</p>
      <h2>Why a map</h2>
      <p>A leaderboard is a list. A map is a place — one your claim sits on for as long as it holds. Watching who&apos;s conquering which territory is most of the fun.</p>
      <h2>Contact</h2>
      <p>
        Questions, moderation reports, or disputes — reach us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </DocumentShell>
  );
}
