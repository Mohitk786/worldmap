"use client";

import { formatUsd, timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/lib/api-types";

export function ActivityTicker({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden max-w-xs flex-col gap-1.5 sm:flex sm:bottom-6 sm:left-6">
      <p className="text-xs text-muted">Latest activity</p>
      <ul className="flex flex-col gap-1.5">
        {activity.slice(0, 4).map((item) => (
          <li key={item.id} className="pointer-events-auto rounded-lg border border-panel-border/70 bg-panel/70 px-3 py-2 text-xs backdrop-blur-sm">
            <span className="text-gold-soft">{item.owner}</span>{" "}
            <span className="text-muted">{item.isNewClaim ? "claimed" : "raised in"}</span>{" "}
            <span className="text-foreground">{item.country}</span>{" "}
            <span className="tabular text-muted">for {formatUsd(item.amount)}</span>
            <span className="block text-[11px] text-muted/70">{timeAgo(item.createdAt)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
