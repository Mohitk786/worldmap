import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { formatUsd } from "@/lib/format";

export function TopBar({
  raised,
  activeCountries,
  watching,
  onOpenWorldOrder,
}: {
  raised: number;
  activeCountries: number;
  watching: number;
  onOpenWorldOrder: () => void;
}) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="pointer-events-auto flex items-center gap-3">
        <Link href="/" className="font-display text-xl text-gold-soft sm:text-2xl">
          {siteConfig.name}
        </Link>
        <span className="hidden text-sm text-muted sm:inline">{siteConfig.tagline}</span>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="tabular text-gold-soft">{formatUsd(raised)} staked</span>
        <span className="tabular text-foreground">{activeCountries} territories claimed</span>
        {watching > 0 && (
          <span className="flex items-center gap-1.5 text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            <span className="tabular">{watching} watching now</span>
          </span>
        )}
        <button
          type="button"
          onClick={onOpenWorldOrder}
          className="rounded-full border border-panel-border bg-panel/80 px-3 py-1.5 font-medium text-gold-soft transition-colors hover:border-gold-soft"
        >
          World Order
        </button>
      </div>
    </header>
  );
}
