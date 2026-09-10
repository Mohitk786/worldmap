import { NextResponse } from "next/server";
import { getWorldOrderLeaderboard } from "@/lib/board";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab");
  const validTab = tab === "crowns" || tab === "early" ? tab : "staked";
  const leaderboard = await getWorldOrderLeaderboard(validTab, 10);
  return NextResponse.json({ tab: validTab, leaderboard });
}
