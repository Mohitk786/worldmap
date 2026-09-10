import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getVisitorId } from "@/lib/visitor";
import { getClientIp, hashIp, rateLimit } from "@/lib/abuse";

/**
 * Fired via `navigator.sendBeacon` on outbound link clicks — never blocks
 * navigation. A listing can be clicked by the same visitor repeatedly, but
 * only counts once per (ip, listing) per minute to keep the counter honest
 * against accidental double-clicks or a bot hammering the link.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const listingId = typeof (body as { listingId?: unknown })?.listingId === "string" ? (body as { listingId: string }).listingId : null;
  if (!listingId) return NextResponse.json({ error: "Missing listingId." }, { status: 400 });

  const ip = getClientIp(request.headers);
  const ipHash = hashIp(ip);
  const isCounted = rateLimit(`click:${ipHash}:${listingId}`, 1, 60_000);

  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!listing) return NextResponse.json({ ok: true });

  const visitorId = await getVisitorId();
  await db.click.create({
    data: {
      listingId,
      visitorId,
      ipHash,
      userAgent: request.headers.get("user-agent"),
      referrer: request.headers.get("referer"),
      isCounted,
    },
  });

  return NextResponse.json({ ok: true });
}
