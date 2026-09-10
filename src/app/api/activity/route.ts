import { NextResponse } from "next/server";
import { getLatestActivity } from "@/lib/board";
import { getVisitorStats } from "@/lib/datafast";

export async function GET() {
  const [activity, stats] = await Promise.all([getLatestActivity(20), getVisitorStats()]);
  return NextResponse.json({ activity, watching: stats?.onlineNow ?? null, visitors: stats?.totalVisitors ?? null });
}
