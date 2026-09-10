import { db } from "@/lib/db";
import { getSiteTotals } from "@/lib/board";
import { formatUsd } from "@/lib/format";
import { ListingStatusControl } from "@/components/admin/ListingStatusControl";
import { ResolveFlagButton } from "@/components/admin/ResolveFlagButton";

export default async function AdminDashboardPage() {
  const [totals, flags, listings] = await Promise.all([
    getSiteTotals(),
    db.moderationFlag.findMany({
      where: { resolvedAt: null },
      orderBy: { createdAt: "desc" },
      include: { listing: { include: { country: { select: { name: true } } } } },
    }),
    db.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { country: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl text-gold-soft">Admin</h1>
        <div className="mt-3 flex gap-6 text-sm">
          <span className="tabular text-foreground">{formatUsd(totals.raised)} raised</span>
          <span className="tabular text-foreground">{totals.activeCountries} countries claimed</span>
          <span className="tabular text-foreground">{totals.totalClaims} active claims</span>
        </div>
      </div>

      <section>
        <h2 className="font-display text-lg text-foreground">Moderation queue ({flags.length})</h2>
        {flags.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing flagged.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {flags.map((flag) => (
              <li key={flag.id} className="flex items-center justify-between gap-4 rounded-lg border border-panel-border bg-panel/50 px-4 py-3 text-sm">
                <div>
                  <p className="text-foreground">
                    {flag.listing.displayName} — {flag.listing.country.name}
                  </p>
                  <p className="text-xs text-muted">{flag.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <ListingStatusControl listingId={flag.listingId} status={flag.listing.status} />
                  <ResolveFlagButton flagId={flag.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg text-foreground">Recent claims</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {listings.map((listing) => (
            <li key={listing.id} className="flex items-center justify-between gap-4 rounded-lg border border-panel-border bg-panel/50 px-4 py-3 text-sm">
              <div>
                <p className="text-foreground">
                  {listing.displayName} — {listing.country.name}
                </p>
                <p className="tabular text-xs text-muted">{formatUsd(listing.currentAmount)}</p>
              </div>
              <ListingStatusControl listingId={listing.id} status={listing.status} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
