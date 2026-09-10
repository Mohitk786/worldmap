import { NextResponse } from "next/server";
import { getFullBoard } from "@/lib/board";

export async function GET() {
  const board = await getFullBoard();
  return NextResponse.json(board, { headers: { "cache-control": "public, max-age=5, stale-while-revalidate=30" } });
}
