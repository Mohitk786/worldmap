import { NextResponse } from "next/server";
import { getPresenceStats } from "@/lib/presence";

export async function GET() {
  const stats = await getPresenceStats();
  return NextResponse.json(stats);
}
