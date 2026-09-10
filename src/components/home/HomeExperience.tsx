"use client";

import { useCallback, useEffect, useState } from "react";
import { WorldGlobe } from "@/components/globe/WorldGlobe";
import { TopBar } from "@/components/home/TopBar";
import { ActivityTicker } from "@/components/home/ActivityTicker";
import { DossierPanel } from "@/components/home/DossierPanel";
import { WorldOrderModal } from "@/components/home/WorldOrderModal";
import type { ActivityResponse, BoardResponse } from "@/lib/api-types";

const BOARD_POLL_MS = 8000;
const ACTIVITY_POLL_MS = 10000;

export function HomeExperience({ initialBoard }: { initialBoard: BoardResponse }) {
  const [board, setBoard] = useState(initialBoard);
  const [activity, setActivity] = useState<ActivityResponse>({ activity: [], watching: null, visitors: null });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [worldOrderOpen, setWorldOrderOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/board")
        .then((res) => res.json() as Promise<BoardResponse>)
        .then(setBoard)
        .catch(() => {});
    }, BOARD_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const load = () =>
      fetch("/api/activity")
        .then((res) => res.json() as Promise<ActivityResponse>)
        .then(setActivity)
        .catch(() => {});
    load();
    const interval = setInterval(load, ACTIVITY_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleSelectCountry = useCallback((name: string) => setSelectedCountry(name), []);
  const handleClose = useCallback(() => setSelectedCountry(null), []);

  const selectedEntry = selectedCountry ? board.countries[selectedCountry] : null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink">
      <WorldGlobe board={board} onSelectCountry={handleSelectCountry} selectedCountry={selectedCountry} />
      <TopBar raised={board.raised} activeCountries={board.activeCountries} watching={activity.watching} onOpenWorldOrder={() => setWorldOrderOpen(true)} />
      <ActivityTicker activity={activity.activity} />
      {selectedEntry && <DossierPanel country={selectedEntry} onClose={handleClose} />}
      {worldOrderOpen && <WorldOrderModal onClose={() => setWorldOrderOpen(false)} />}
    </div>
  );
}
