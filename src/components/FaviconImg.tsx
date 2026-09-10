"use client";

import { useMemo, useState } from "react";

function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Cascading favicon fallback chain: DuckDuckGo → unavatar → our own proxy → Google favicons → gstatic → letter placeholder. */
export function FaviconImg({ destinationUrl, name, size = 28 }: { destinationUrl: string; name: string; size?: number }) {
  const domain = useMemo(() => domainOf(destinationUrl), [destinationUrl]);
  const candidates = useMemo(() => {
    if (!domain) return [] as string[];
    return [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://unavatar.io/${domain}?fallback=false`,
      `/api/icon-image?url=${encodeURIComponent(destinationUrl)}`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
    ];
  }, [domain, destinationUrl]);

  const [index, setIndex] = useState(0);

  if (!domain || index >= candidates.length) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-panel-border font-display text-gold-soft"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external favicon sources vary in size/format; next/image's optimizer isn't worth it here.
    <img
      src={candidates[index]}
      onError={() => setIndex((i) => i + 1)}
      width={size}
      height={size}
      alt=""
      aria-hidden
      className="rounded-full bg-panel-border object-cover"
      style={{ width: size, height: size }}
    />
  );
}
