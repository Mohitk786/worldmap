import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnerProfile } from "@/lib/board";
import { FaviconImg } from "@/components/FaviconImg";
import { formatUsd } from "@/lib/format";
import { siteConfig } from "@/lib/site-config";

async function loadProfile(key: string) {
  const normalizedKey = decodeURIComponent(key);
  return getOwnerProfile(normalizedKey);
}

export async function generateMetadata({ params }: PageProps<"/pin/[key]">): Promise<Metadata> {
  const { key } = await params;
  const profile = await loadProfile(key);
  if (!profile) return { title: "Not found" };
  return { title: `${profile.displayName} · ${profile.tier}` };
}

export default async function PinPage({ params }: PageProps<"/pin/[key]">) {
  const { key } = await params;
  const profile = await loadProfile(key);
  if (!profile) notFound();

  return (
    <div className="min-h-dvh bg-ink px-6 py-10 sm:px-10">
      <Link href="/" className="font-display text-xl text-gold-soft">
        {siteConfig.name}
      </Link>

      <div className="mx-auto mt-10 max-w-2xl">
        <div className="flex items-center gap-4">
          <FaviconImg destinationUrl={profile.destinationUrl} name={profile.displayName} size={56} />
          <div>
            <h1 className="font-display text-3xl text-foreground">{profile.displayName}</h1>
            <p className="text-gold-soft">
              {profile.tier} {profile.isEarly && "· Founder"}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Crowns", profile.crowns],
            ["Territories", profile.countriesPresent],
            ["Top-3 spots", profile.top3Count],
            ["Total staked", formatUsd(profile.totalStaked)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-panel-border bg-panel/60 p-4">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="tabular mt-1 text-xl text-gold-soft">{value}</dd>
            </div>
          ))}
        </dl>

        {profile.firstToClaimCount > 0 && (
          <p className="mt-4 text-sm text-muted">First to claim {profile.firstToClaimCount} {profile.firstToClaimCount === 1 ? "country" : "countries"}.</p>
        )}

        <h2 className="mt-10 font-display text-xl text-foreground">Territories</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {profile.countries.map((c) => (
            <li key={c.country} className="flex items-center justify-between rounded-lg border border-panel-border/70 bg-panel/40 px-4 py-3 text-sm">
              <div>
                <span className="text-foreground">{c.country}</span>
                <span className="ml-2 text-xs text-muted">#{c.rank}</span>
                {c.pitch && <span className="block text-xs text-muted">{c.pitch}</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="tabular text-xs text-muted">{c.clicks} clicks</span>
                <span className="tabular text-gold-soft">{formatUsd(c.amount)}</span>
              </div>
            </li>
          ))}
        </ul>

        <a href={profile.destinationUrl} target="_blank" rel="noopener noreferrer nofollow sponsored" className="mt-8 inline-block rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink-deep">
          Visit {profile.displayName}
        </a>
      </div>
    </div>
  );
}
