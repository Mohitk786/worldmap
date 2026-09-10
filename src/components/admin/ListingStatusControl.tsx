"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["ACTIVE", "UNDER_REVIEW", "REMOVED"] as const;

export function ListingStatusControl({ listingId, status }: { listingId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setStatus(next: string) {
    if (next === status) return;
    setPending(true);
    await fetch(`/api/admin/listings/${listingId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => setStatus(e.target.value)}
      className="rounded-lg border border-panel-border bg-ink-deep px-2 py-1 text-xs text-foreground"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
