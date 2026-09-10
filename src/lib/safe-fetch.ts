import dns from "node:dns/promises";
import net from "node:net";

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 5000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB cap on fetched body

/**
 * Blocks the private/loopback/link-local ranges that make a server-side
 * "fetch whatever URL the user gives us" feature a classic SSRF vector
 * (cloud metadata endpoints, internal admin panels, etc).
 */
function isDisallowedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true; // loopback
    if (normalized.startsWith("fe80:")) return true; // link-local
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local
    if (normalized.startsWith("::ffff:")) {
      // IPv4-mapped IPv6 — check the embedded IPv4 address too
      const v4 = normalized.split(":").pop();
      if (v4 && net.isIPv4(v4)) return isDisallowedIp(v4);
    }
    return false;
  }
  return true; // not a plain IP literal — treat conservatively
}

async function assertHostIsSafe(hostname: string): Promise<void> {
  if (net.isIP(hostname)) {
    if (isDisallowedIp(hostname)) throw new Error("Refusing to fetch a private/internal IP address.");
    return;
  }
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".internal")) {
    throw new Error("Refusing to fetch a local/internal hostname.");
  }
  const records = await dns.lookup(hostname, { all: true });
  if (records.length === 0) throw new Error("Hostname did not resolve to any address.");
  for (const record of records) {
    if (isDisallowedIp(record.address)) {
      throw new Error("Refusing to fetch a hostname that resolves to a private/internal IP.");
    }
  }
}

export type SafeFetchResult = {
  html: string;
  finalUrl: string;
};

/**
 * Fetches a remote URL for OG/metadata extraction while resisting SSRF:
 * validates the resolved IP of every hop (not just the initial hostname),
 * follows redirects manually with a hop cap, enforces a timeout, and caps
 * the amount of body read.
 */
export async function safeFetchHtml(inputUrl: string): Promise<SafeFetchResult | null> {
  let current = inputUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(current);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Only http/https URLs are allowed.");
    }
    await assertHostIsSafe(parsed.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(parsed.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "WorldMapBot/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      current = new URL(location, parsed).toString();
      continue;
    }

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return null;
    }

    const reader = response.body?.getReader();
    if (!reader) return null;
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
    return { html, finalUrl: parsed.toString() };
  }

  return null;
}
