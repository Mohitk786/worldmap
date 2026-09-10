import { NextResponse } from "next/server";

// Proxies favicon lookups through Google's public favicon service rather
// than fetching the destination site directly ourselves — Google does the
// actual fetch of arbitrary third-party infrastructure, not our server,
// which sidesteps the SSRF surface that a direct fetch would open up.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url");
  if (!rawUrl) return NextResponse.json({ error: "Missing url." }, { status: 400 });

  let hostname: string;
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid url." }, { status: 400 });
  }

  if (!/^[a-z0-9.-]+$/.test(hostname)) {
    return NextResponse.json({ error: "Invalid hostname." }, { status: 400 });
  }

  // Google's faviconV2 endpoint quirkily returns HTTP 404 even when it
  // serves a valid fallback globe icon — so success is judged by
  // content-type, not status.
  const upstream = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(`https://${hostname}`)}&size=64`;

  try {
    const response = await fetch(upstream, { signal: AbortSignal.timeout(4000) });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.body || !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Could not fetch favicon." }, { status: 502 });
    }
    return new NextResponse(response.body, {
      headers: { "content-type": contentType, "cache-control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch favicon." }, { status: 502 });
  }
}
