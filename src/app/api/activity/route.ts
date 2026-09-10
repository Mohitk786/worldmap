import { NextResponse } from "next/server";
import { getLatestActivity } from "@/lib/board";
import { getPresenceStats } from "@/lib/presence";

export async function GET() {
  const [activity, presence] = await Promise.all([getLatestActivity(20), getPresenceStats()]);
  return NextResponse.json({ activity, watching: presence.watching, visitors72h: presence.visitors72h });
}
