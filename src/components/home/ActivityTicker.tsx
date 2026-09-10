"use client";

import { Flag, TrendingUp } from "lucide-react";
import { formatUsd, timeAgo } from "@/lib/format";
import type { ActivityItem } from "@/lib/api-types";

export function ActivityTicker({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden w-72 flex-col gap-2 sm:flex sm:bottom-6 sm:left-6">
      <div className="flex items-center gap-1.5 px-1">
        <span className="h-1.5 w-1.5 rounded-full bg-teal" />
        <p className="text-sm font-medium text-foreground">Live activity</p>
      </div>

      <ul className="pointer-events-auto flex flex-col gap-1.5 overflow-hidden rounded-2xl border border-panel-border bg-panel/90 shadow-lg backdrop-blur-md">
        {activity.slice(0, 4).map((item, i) => (
          <li
            key={item.id}
            className={`flex items-center gap-3 px-3 py-2.5 ${i > 0 ? "border-t border-panel-border/60" : ""}`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                item.isNewClaim ? "bg-gold/15 text-gold-soft" : "bg-teal/15 text-teal"
              }`}
            >
              {item.isNewClaim ? <Flag size={14} strokeWidth={2.5} /> : <TrendingUp size={14} strokeWidth={2.5} />}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{item.owner}</span>
              <span className="block truncate text-xs text-muted">
                {item.isNewClaim ? "claimed" : "raised in"} {item.country}
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end">
              <span className="tabular text-sm font-semibold text-gold-soft">{formatUsd(item.amount)}</span>
              <span className="text-[11px] text-muted/70">{timeAgo(item.createdAt)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
