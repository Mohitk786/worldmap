"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatUsd } from "@/lib/format";
import type { CheckoutStatusResponse } from "@/lib/api-types";

const POLL_MS = 2000;
const MAX_POLLS = 30;

export function SuccessStatus({ checkoutId }: { checkoutId: string }) {
  const [data, setData] = useState<CheckoutStatusResponse | null>(null);
  const [polls, setPolls] = useState(0);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (data?.status === "SUCCEEDED" || data?.status === "FAILED" || data?.status === "EXPIRED") return;
    if (polls >= MAX_POLLS) return;

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/checkout/status?checkoutId=${encodeURIComponent(checkoutId)}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const json = (await res.json()) as CheckoutStatusResponse;
      setData(json);
      setPolls((p) => p + 1);
    }, polls === 0 ? 0 : POLL_MS);

    return () => clearTimeout(timeout);
  }, [checkoutId, polls, data?.status]);

  if (notFound) {
    return <p className="text-danger">We couldn&apos;t find that checkout.</p>;
  }

  if (!data) {
    return <p className="text-muted">Checking your payment…</p>;
  }

  if (data.status === "SUCCEEDED") {
    return (
      <div className="claim-pulse rounded-2xl border border-gold/40 bg-ink-deep/60 p-6">
        <p className="font-display text-2xl text-gold-soft">Claim confirmed</p>
        <p className="mt-2 text-foreground">
          {data.displayName} staked {formatUsd(data.amount)} on {data.country?.name ?? "the map"}.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/" className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink-deep">
            Back to the map
          </Link>
          <Link href={`/pin/${encodeURIComponent(data.normalizedKey)}`} className="rounded-lg border border-panel-border px-4 py-2 text-sm text-foreground">
            View your page
          </Link>
        </div>
      </div>
    );
  }

  if (data.status === "FAILED" || data.status === "EXPIRED") {
    return (
      <div>
        <p className="text-danger">This payment didn&apos;t go through.</p>
        <Link href="/" className="mt-3 inline-block rounded-lg border border-panel-border px-4 py-2 text-sm text-foreground">
          Try again
        </Link>
      </div>
    );
  }

  return <p className="text-muted">Waiting for payment confirmation…</p>;
}
