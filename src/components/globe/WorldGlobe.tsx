"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { GlobeMethods } from "react-globe.gl";
import { getCountryFeatures, type CountryFeature } from "@/lib/countries";
import { escapeHtml, formatUsd } from "@/lib/format";
import type { BoardResponse } from "@/lib/api-types";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const UNCLAIMED_COLOR = "#2a3448";
const HOVER_RING = "#3ec9b3";

// A publicly spotlighted premium territory — a $100 floor and a permanent
// gold glow/badge, the opposite of the hidden low-floor easter egg.
const FEATURED_COUNTRY = "Antarctica";
const FEATURED_COLOR = "#f4c542";
const FEATURED_COLOR_HOVER = "#ffda69";
const FEATURED_BADGE = { lat: -75, lng: 15 };

// A small curated set of distinct hues — assigned per country name (not per
// bid amount) purely for visual variety, so owned countries read as a
// colorful map rather than one color at varying opacity.
const CLAIMED_PALETTE = [
  "#e8a33d",
  "#4fb8d6",
  "#a687e0",
  "#6fbf8b",
  "#e08a9e",
  "#e0c25a",
  "#4fbfae",
  "#e0805a",
  "#7fa0d6",
  "#c290c9",
];

function paletteColorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return CLAIMED_PALETTE[hash % CLAIMED_PALETTE.length]!;
}

export function WorldGlobe({
  board,
  onSelectCountry,
  selectedCountry,
}: {
  board: BoardResponse;
  onSelectCountry: (countryName: string) => void;
  selectedCountry: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<string | null>(null);

  const features = useMemo<CountryFeature[]>(() => getCountryFeatures(), []);
  const maxAmount = useMemo(() => {
    let max = 0;
    for (const entry of Object.values(board.countries)) {
      const top = entry.listings[0];
      if (top && top.currentAmount > max) max = top.currentAmount;
    }
    return max || 1;
  }, [board]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const globeMaterial = useMemo(() => new THREE.MeshPhongMaterial({ color: "#0b1220", shininess: 4 }), []);

  // The globe's WebGL scene (and its OrbitControls) initializes
  // asynchronously inside react-globe.gl — grabbing `.controls()` in a
  // mount-time effect can run before it exists and silently no-op forever,
  // and even `onGlobeReady` fires one tick before it's actually attached.
  // Polling briefly is the reliable way to catch it.
  function handleGlobeReady() {
    globeRef.current?.pointOfView({ lat: 18, lng: 12, altitude: 1.6 }, 0);
    let attempts = 0;
    const tryEnableAutoRotate = () => {
      const controls = globeRef.current?.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.35;
        controls.enableDamping = true;
        return;
      }
      attempts += 1;
      if (attempts < 40) setTimeout(tryEnableAutoRotate, 100);
    };
    tryEnableAutoRotate();
  }

  function capColor(feature: object): string {
    const name = (feature as CountryFeature).properties.name;
    const entry = board.countries[name];
    const top = entry?.listings[0];
    if (!top) {
      if (name === FEATURED_COUNTRY) return name === hovered ? FEATURED_COLOR_HOVER : FEATURED_COLOR;
      return name === hovered ? "#3a465f" : UNCLAIMED_COLOR;
    }
    return paletteColorFor(name);
  }

  function altitude(feature: object): number {
    const name = (feature as CountryFeature).properties.name;
    const entry = board.countries[name];
    const top = entry?.listings[0];
    const unclaimedBase = name === FEATURED_COUNTRY ? 0.02 : 0.006;
    const base = top ? 0.012 + 0.05 * Math.min(top.currentAmount / maxAmount, 1) : unclaimedBase;
    return name === hovered || name === selectedCountry ? base + 0.02 : base;
  }

  function strokeColor(feature: object): string {
    const name = (feature as CountryFeature).properties.name;
    if (name === selectedCountry) return HOVER_RING;
    if (name === FEATURED_COUNTRY) return FEATURED_COLOR;
    if (name === hovered) return "#c9d3e4";
    return "#070c16";
  }

  function label(feature: object): string {
    const name = (feature as CountryFeature).properties.name;
    const entry = board.countries[name];
    const top = entry?.listings[0];
    const safeName = escapeHtml(name);
    if (!top) {
      const floorNote = name === FEATURED_COUNTRY ? "★ Featured territory — from" : "Unclaimed — from";
      return `<div class="globe-tip"><strong>${safeName}</strong><br/><span>${floorNote} ${formatUsd(entry?.priceFloor ?? 5)}</span></div>`;
    }
    const safeOwner = escapeHtml(top.displayName);
    const safePitch = top.pitch ? `<br/><span>${escapeHtml(top.pitch)}</span>` : "";
    return `<div class="globe-tip"><strong>${safeName}</strong><br/><span>#1 ${safeOwner} — ${formatUsd(top.currentAmount)}</span>${safePitch}</div>`;
  }

  return (
    <div ref={containerRef} className="absolute inset-0">
      {size.width > 0 && (
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showGraticules
          showAtmosphere
          atmosphereColor="#3ec9b3"
          atmosphereAltitude={0.16}
          polygonsData={features}
          polygonCapColor={capColor}
          polygonSideColor={() => "rgba(7, 12, 22, 0.55)"}
          polygonStrokeColor={strokeColor}
          polygonAltitude={altitude}
          polygonLabel={label}
          polygonsTransitionDuration={250}
          onPolygonClick={(f) => onSelectCountry((f as CountryFeature).properties.name)}
          onPolygonHover={(f) => setHovered(f ? (f as CountryFeature).properties.name : null)}
          onGlobeReady={handleGlobeReady}
          htmlElementsData={[FEATURED_BADGE]}
          htmlLat={(d) => (d as typeof FEATURED_BADGE).lat}
          htmlLng={(d) => (d as typeof FEATURED_BADGE).lng}
          htmlAltitude={0.05}
          htmlElement={() => {
            const el = document.createElement("div");
            el.className = "globe-featured-badge";
            el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7-5.4-4.7 7.1-.6L12 2Z"/></svg><span>Featured — $100</span>`;
            return el;
          }}
        />
      )}
    </div>
  );
}
