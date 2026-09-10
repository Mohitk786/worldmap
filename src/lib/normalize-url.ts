export class SubmissionValidationError extends Error {}

// Chat/invite links are rejected outright — a listing must point at a
// product or a real public profile, not a group chat someone can be funneled
// into (mirrors worldmap's own documented rule).
const CHAT_INVITE_HOSTS = ["t.me", "telegram.me", "wa.me", "chat.whatsapp.com", "discord.gg", "signal.me", "signal.group", "m.me", "messenger.com"];

const X_HOSTS = ["twitter.com", "x.com", "mobile.twitter.com"];

function stripWww(hostname: string): string {
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

function isChatInviteHost(hostname: string): boolean {
  return CHAT_INVITE_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

function isDiscordInvite(hostname: string, pathname: string): boolean {
  return hostname === "discord.com" && pathname.startsWith("/invite/");
}

export type SocialPlatform = "x" | "instagram" | "github" | "youtube";

export type NormalizedSubmission =
  | { type: "SOCIAL_PROFILE"; platform: SocialPlatform; normalizedKey: string; destinationUrl: string; displayHint: string }
  | { type: "PRODUCT_URL"; platform: null; normalizedKey: string; destinationUrl: string; displayHint: string };

function normalizeXHandle(raw: string): string {
  const handle = raw.replace(/^@/, "").trim().toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) {
    throw new SubmissionValidationError("That doesn't look like a valid X/Twitter handle.");
  }
  return handle;
}

function firstSegment(pathname: string): string | undefined {
  return pathname.split("/").filter(Boolean)[0];
}

function socialProfile(platform: SocialPlatform, handle: string, destinationUrl: string): NormalizedSubmission {
  return {
    type: "SOCIAL_PROFILE",
    platform,
    normalizedKey: `${platform}:${handle.toLowerCase()}`,
    destinationUrl,
    displayHint: `@${handle}`,
  };
}

export function normalizeSubmission(rawInput: string): NormalizedSubmission {
  const input = rawInput.trim();
  if (!input) throw new SubmissionValidationError("Enter a product URL, or a social profile URL / @handle.");

  if (input.startsWith("@")) {
    const handle = normalizeXHandle(input);
    return socialProfile("x", handle, `https://x.com/${handle}`);
  }

  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    throw new SubmissionValidationError("Enter a valid URL, like example.com or https://example.com.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SubmissionValidationError("Only http/https URLs are supported.");
  }

  const hostname = stripWww(url.hostname.toLowerCase());

  if (isChatInviteHost(hostname) || isDiscordInvite(hostname, url.pathname)) {
    throw new SubmissionValidationError(
      "Chat/invite links (Telegram, WhatsApp, Discord, Signal, Messenger) aren't accepted — link to a product or a profile."
    );
  }

  if (X_HOSTS.includes(hostname)) {
    const handle = firstSegment(url.pathname);
    if (!handle) throw new SubmissionValidationError("Couldn't find a handle in that X/Twitter URL.");
    const normalized = normalizeXHandle(handle);
    return socialProfile("x", normalized, `https://x.com/${normalized}`);
  }

  if (hostname === "instagram.com") {
    const handle = firstSegment(url.pathname);
    const reserved = ["p", "reel", "reels", "explore", "stories", "tv"];
    if (!handle || reserved.includes(handle.toLowerCase())) {
      throw new SubmissionValidationError("Link to an Instagram profile, not an individual post or reel.");
    }
    if (!/^[a-z0-9._]{1,30}$/i.test(handle)) {
      throw new SubmissionValidationError("That doesn't look like a valid Instagram profile.");
    }
    return socialProfile("instagram", handle, `https://instagram.com/${handle}`);
  }

  if (hostname === "github.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length !== 1) {
      throw new SubmissionValidationError("Link to a GitHub profile or org page, not a specific repo.");
    }
    return socialProfile("github", segments[0]!, `https://github.com/${segments[0]}`);
  }

  if (hostname === "youtube.com" || hostname === "youtu.be") {
    const segments = url.pathname.split("/").filter(Boolean);
    if (hostname === "youtube.com" && segments[0] === "watch") {
      throw new SubmissionValidationError("Link to a YouTube channel, not an individual video.");
    }
    if (hostname === "youtube.com" && segments[0] === "shorts") {
      throw new SubmissionValidationError("Link to a YouTube channel, not an individual short.");
    }
    let handle: string | undefined;
    if (segments[0]?.startsWith("@")) handle = segments[0];
    else if ((segments[0] === "channel" || segments[0] === "c" || segments[0] === "user") && segments[1]) handle = segments[1];
    if (!handle) throw new SubmissionValidationError("Couldn't find a channel in that YouTube URL.");
    return socialProfile("youtube", handle.replace(/^@/, ""), url.toString());
  }

  if (!hostname.includes(".")) {
    throw new SubmissionValidationError("Enter a valid URL.");
  }

  // Product URLs are reduced to the bare domain — path, query string (UTM/affiliate
  // params included), and fragment are all stripped, so site.com/page?utm=x and
  // site.com are treated as the exact same listing.
  return {
    type: "PRODUCT_URL",
    platform: null,
    normalizedKey: hostname,
    destinationUrl: `https://${hostname}`,
    displayHint: hostname,
  };
}
