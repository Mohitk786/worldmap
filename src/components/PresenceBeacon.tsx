"use client";

import { useEffect } from "react";

const HEARTBEAT_MS = 45_000;

/** Real per-visitor heartbeat — see src/lib/presence.ts for what it powers and what it never fabricates. */
export function PresenceBeacon() {
  useEffect(() => {
    const ping = () => {
      try {
        navigator.sendBeacon("/api/presence", new Blob([], { type: "application/json" }));
      } catch {
        fetch("/api/presence", { method: "POST", keepalive: true }).catch(() => {});
      }
    };
    ping();
    const interval = setInterval(ping, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, []);

  return null;
}
