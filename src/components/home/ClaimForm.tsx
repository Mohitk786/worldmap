"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/format";

export function ClaimForm({ countrySlug, priceFloor, amountToTakeFirst }: { countrySlug: string; priceFloor: number; amountToTakeFirst: number | null }) {
  const [input, setInput] = useState("");
  const [pitch, setPitch] = useState("");
  const [amount, setAmount] = useState(priceFloor);
  const [tosAgreed, setTosAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!tosAgreed) {
      setError("Agree to the rules to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input, countrySlug, pitch: pitch || undefined, amount, tosAgreed: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 border-t border-panel-border pt-4">
      <p className="font-display text-base text-gold-soft">Claim or raise your stake</p>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Product URL or social profile
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="yourproduct.com or @handle"
          required
          maxLength={500}
          className="rounded-lg border border-panel-border bg-ink-deep px-3 py-2 text-sm text-foreground outline-none focus:border-gold-soft"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        One line about it (optional)
        <input
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="What is it?"
          maxLength={140}
          className="rounded-lg border border-panel-border bg-ink-deep px-3 py-2 text-sm text-foreground outline-none focus:border-gold-soft"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-muted">
        Stake amount (minimum {formatUsd(priceFloor)})
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={priceFloor}
            step={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
            className="tabular w-28 rounded-lg border border-panel-border bg-ink-deep px-3 py-2 text-sm text-foreground outline-none focus:border-gold-soft"
          />
          {amountToTakeFirst !== null && (
            <button
              type="button"
              onClick={() => setAmount(amountToTakeFirst)}
              className="rounded-full border border-gold/50 px-3 py-1.5 text-xs text-gold-soft transition-colors hover:border-gold-soft"
            >
              Take #1 for {formatUsd(amountToTakeFirst)}
            </button>
          )}
        </div>
      </label>

      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" checked={tosAgreed} onChange={(e) => setTosAgreed(e.target.checked)} className="mt-0.5" />
        <span>
          This is advertising, not a bet — no refunds, no payouts. I agree to the{" "}
          <a href="/rules" target="_blank" className="text-gold-soft underline underline-offset-2">
            rules
          </a>
          .
        </span>
      </label>

      {error && <p className="text-xs text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-ink-deep transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Starting checkout…" : `Pay with Dodo — ${formatUsd(amount)}`}
      </button>
    </form>
  );
}
