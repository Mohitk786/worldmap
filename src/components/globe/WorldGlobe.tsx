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

function goldWithAlpha(alpha: number): string {
  return `rgba(212, 162, 76, ${alpha.toFixed(2)})`;
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

  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enableDamping = true;
    globeRef.current?.pointOfView({ lat: 18, lng: 12, altitude: 2.3 }, 0);
  }, []);

  function capColor(feature: object): string {
    const name = (feature as CountryFeature).properties.name;
    const entry = board.countries[name];
    const top = entry?.listings[0];
    if (!top) return name === hovered ? "#3a465f" : UNCLAIMED_COLOR;
    const alpha = 0.45 + 0.55 * Math.min(top.currentAmount / maxAmount, 1);
    return goldWithAlpha(alpha);
  }

  function altitude(feature: object): number {
    const name = (feature as CountryFeature).properties.name;
    const entry = board.countries[name];
    const top = entry?.listings[0];
    const base = top ? 0.012 + 0.05 * Math.min(top.currentAmount / maxAmount, 1) : 0.006;
    return name === hovered || name === selectedCountry ? base + 0.02 : base;
  }

  function strokeColor(feature: object): string {
    const name = (feature as CountryFeature).properties.name;
    if (name === selectedCountry) return HOVER_RING;
    if (name === hovered) return "#c9d3e4";
    return "#070c16";
  }

  function label(feature: object): string {
    const name = (feature as CountryFeature).properties.name;
    const entry = board.countries[name];
    const top = entry?.listings[0];
    const safeName = escapeHtml(name);
    if (!top) {
      return `<div class="globe-tip"><strong>${safeName}</strong><br/><span>Unclaimed — from ${formatUsd(entry?.priceFloor ?? 5)}</span></div>`;
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
        />
      )}
    </div>
  );
}
