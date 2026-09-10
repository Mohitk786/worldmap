import { getFullBoard } from "@/lib/board";
import { HomeExperience } from "@/components/home/HomeExperience";
import type { BoardResponse } from "@/lib/api-types";

export default async function HomePage() {
  const board = await getFullBoard();
  // Round-tripped through JSON so the shape (Dates -> ISO strings) exactly
  // matches what /api/board returns to the client-side poller — the same
  // BoardResponse type describes both.
  const initialBoard = JSON.parse(JSON.stringify(board)) as BoardResponse;
  return <HomeExperience initialBoard={initialBoard} />;
}
