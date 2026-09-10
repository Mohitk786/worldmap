import * as cheerio from "cheerio";
import { safeFetchHtml } from "./safe-fetch";
import type { NormalizedSubmission } from "./normalize-url";

export type ResolvedMetadata = {
  displayName: string;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string;
};

function truncate(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function resolveMaybeRelative(url: string, base: string): string | null {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

export function faviconProxyUrl(destinationUrl: string): string {
  return `/api/icon-image?url=${encodeURIComponent(destinationUrl)}`;
}

export async function resolveMetadata(submission: NormalizedSubmission): Promise<ResolvedMetadata> {
  const faviconUrl = faviconProxyUrl(submission.destinationUrl);

  if (submission.type === "SOCIAL_PROFILE") {
    // Social platforms' public profile pages are heavily JS-rendered and
    // block naive bot fetches, so we don't attempt to scrape them — the
    // handle itself is a perfectly good display name.
    return { displayName: submission.displayHint, description: null, imageUrl: null, faviconUrl };
  }

  try {
    const result = await safeFetchHtml(submission.destinationUrl);
    if (!result) {
      return { displayName: submission.displayHint, description: null, imageUrl: null, faviconUrl };
    }

    const $ = cheerio.load(result.html);
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    const titleTag = $("title").first().text();
    const rawTitle = ogTitle || twitterTitle || titleTag || submission.displayHint;

    const ogDescription = $('meta[property="og:description"]').attr("content");
    const metaDescription = $('meta[name="description"]').attr("content");
    const twitterDescription = $('meta[name="twitter:description"]').attr("content");
    const rawDescription = ogDescription || metaDescription || twitterDescription;

    const ogImage = $('meta[property="og:image"]').attr("content");
    const twitterImage = $('meta[name="twitter:image"]').attr("content");
    const rawImage = ogImage || twitterImage;

    return {
      displayName: truncate(rawTitle, 120),
      description: rawDescription ? truncate(rawDescription, 300) : null,
      imageUrl: rawImage ? resolveMaybeRelative(rawImage, result.finalUrl) : null,
      faviconUrl,
    };
  } catch {
    return { displayName: submission.displayHint, description: null, imageUrl: null, faviconUrl };
  }
}
