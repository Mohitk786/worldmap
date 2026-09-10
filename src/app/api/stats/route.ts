import { NextResponse } from "next/server";
import { getOnlineCities } from "@/lib/presence";
import { getVisitorStats } from "@/lib/datafast";

export async function GET() {
  const [stats, online] = await Promise.all([getVisitorStats(), getOnlineCities()]);
  return NextResponse.json({
    watching: stats?.onlineNow ?? null,
    visitors: stats?.totalVisitors ?? null,
    online,
  });
}
