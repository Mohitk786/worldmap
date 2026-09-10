"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaviconImg } from "@/components/FaviconImg";
import { formatUsd } from "@/lib/format";
import type { WorldOrderEntry, WorldOrderResponse } from "@/lib/api-types";

const TABS = [
  { key: "staked", label: "Top stakers" },
  { key: "crowns", label: "Most crowns" },
  { key: "early", label: "Founders" },
] as const;

export function WorldOrderModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("staked");
  const [result, setResult] = useState<{ tab: string; entries: WorldOrderEntry[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/world-order?tab=${tab}`)
      .then((res) => res.json() as Promise<WorldOrderResponse>)
      .then((data) => {
        if (!cancelled) setResult({ tab: data.tab, entries: data.leaderboard });
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const loading = result?.tab !== tab;
  const entries = result?.tab === tab ? result.entries : [];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-deep/70 p-4" onClick={onClose}>
      <div
        className="dossier-enter max-h-[80vh] w-full max-w-lg overflow-y-auto scrollbar-thin rounded-2xl border border-panel-border bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl text-gold-soft">World Order</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-panel-border px-2.5 py-1 text-muted hover:text-foreground">
            ×
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key ? "border-gold-soft text-gold-soft" : "border-panel-border text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ol className="mt-4 flex flex-col gap-2">
          {loading && <p className="text-sm text-muted">Loading…</p>}
          {!loading && entries.length === 0 && <p className="text-sm text-muted">No claims yet — be the first.</p>}
          {entries.map((entry, i) => (
            <li key={entry.normalizedKey} className="flex items-center gap-3 rounded-lg border border-panel-border/70 bg-ink-deep/40 px-3 py-2">
              <span className="tabular w-5 text-sm text-muted">{i + 1}</span>
              <FaviconImg destinationUrl={entry.destinationUrl} name={entry.displayName} size={26} />
              <Link href={`/pin/${encodeURIComponent(entry.normalizedKey)}`} className="min-w-0 flex-1 truncate text-sm text-foreground hover:text-gold-soft">
                {entry.displayName} <span className="text-xs text-muted">· {entry.tier}</span>
              </Link>
              <span className="tabular shrink-0 text-xs text-muted">{entry.countriesPresent} territories</span>
              <span className="tabular shrink-0 text-sm text-gold-soft">{tab === "crowns" ? `${entry.crowns} crowns` : formatUsd(entry.totalStaked)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
