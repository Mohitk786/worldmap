"use client";

import { FaviconImg } from "@/components/FaviconImg";
import { ClaimForm } from "@/components/home/ClaimForm";
import { formatUsd } from "@/lib/format";
import type { CountryBoardEntry } from "@/lib/api-types";

function trackClick(listingId: string) {
  try {
    navigator.sendBeacon("/api/click", new Blob([JSON.stringify({ listingId })], { type: "application/json" }));
  } catch {
    // best-effort only
  }
}

export function DossierPanel({ country, onClose }: { country: CountryBoardEntry; onClose: () => void }) {
  const top = country.listings[0];
  const amountToTakeFirst = top ? Math.max(top.currentAmount + 1, country.priceFloor) : null;

  return (
    <aside className="dossier-enter pointer-events-auto fixed inset-x-0 bottom-0 z-30 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-panel-border bg-panel/95 p-5 shadow-2xl backdrop-blur-md sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[26rem] sm:max-h-none sm:rounded-none sm:rounded-l-2xl sm:border-t-0 sm:border-l">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted">Territory</p>
          <h2 className="font-display text-2xl text-foreground">{country.name}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-panel-border px-2.5 py-1 text-muted hover:text-foreground">
          ×
        </button>
      </div>

      {country.listings.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Unclaimed — be the first to stake it, from {formatUsd(country.priceFloor)}.</p>
      ) : (
        <ol className="mt-4 flex flex-col gap-2 scrollbar-thin max-h-64 overflow-y-auto pr-1">
          {country.listings.map((listing, i) => (
            <li key={listing.id} className="flex items-center gap-3 rounded-lg border border-panel-border/70 bg-ink-deep/40 px-3 py-2">
              <span className="tabular w-5 text-sm text-muted">#{i + 1}</span>
              <FaviconImg destinationUrl={listing.destinationUrl} name={listing.displayName} size={24} />
              <a
                href={listing.destinationUrl}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                onClick={() => trackClick(listing.id)}
                className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-gold-soft"
              >
                {listing.displayName}
                {listing.pitch && <span className="block truncate text-xs text-muted">{listing.pitch}</span>}
              </a>
              <span className="tabular shrink-0 text-sm text-gold-soft">{formatUsd(listing.currentAmount)}</span>
            </li>
          ))}
        </ol>
      )}

      <ClaimForm countrySlug={country.slug} priceFloor={country.priceFloor} amountToTakeFirst={amountToTakeFirst} />
    </aside>
  );
}
