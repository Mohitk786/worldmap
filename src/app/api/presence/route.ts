import { NextResponse } from "next/server";
import { getOrCreateVisitorId } from "@/lib/visitor";
import { getGeoHint } from "@/lib/abuse";
import { recordPresence } from "@/lib/presence";

/** Heartbeat pinged from the client every ~45s. See presence.ts for what this does and doesn't fabricate. */
export async function POST(request: Request) {
  const visitorId = await getOrCreateVisitorId();
  await recordPresence(visitorId, getGeoHint(request.headers));
  return NextResponse.json({ ok: true });
}
