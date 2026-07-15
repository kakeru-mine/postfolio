import { SourcePlatform } from "@prisma/client";

const platformLabels: Record<SourcePlatform, string> = {
  X: "X",
  NOTE: "note",
  YOUTUBE: "YouTube",
  SUBSTACK: "Substack",
  TIKTOK: "TikTok",
  INSTAGRAM: "Instagram",
  THREADS: "Threads",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  REDDIT: "Reddit",
  BLUESKY: "Bluesky",
  OTHER: "その他",
};

export const supportedPlatforms = [
  "X",
  "INSTAGRAM",
  "THREADS",
  "YOUTUBE",
  "NOTE",
  "SUBSTACK",
  "TIKTOK",
  "REDDIT",
  "BLUESKY",
] as const satisfies readonly SourcePlatform[];

export function detectPlatform(hostname: string): SourcePlatform {
  const host = hostname.replace(/^www\./, "").toLowerCase();

  if (isDomain(host, "x.com") || isDomain(host, "twitter.com"))
    return "X";
  if (isDomain(host, "instagram.com")) return "INSTAGRAM";
  if (isDomain(host, "threads.com") || isDomain(host, "threads.net"))
    return "THREADS";
  if (
    isDomain(host, "facebook.com") ||
    isDomain(host, "fb.com") ||
    isDomain(host, "fb.watch")
  )
    return "FACEBOOK";
  if (isDomain(host, "youtube.com") || host === "youtu.be")
    return "YOUTUBE";
  if (isDomain(host, "note.com")) return "NOTE";
  if (host.endsWith(".substack.com") || host === "substack.com")
    return "SUBSTACK";
  if (isDomain(host, "tiktok.com")) return "TIKTOK";
  if (isDomain(host, "linkedin.com") || host === "lnkd.in")
    return "LINKEDIN";
  if (isDomain(host, "reddit.com") || host === "redd.it")
    return "REDDIT";
  if (isDomain(host, "bsky.app")) return "BLUESKY";
  return "OTHER";
}

export function platformLabel(platform: SourcePlatform) {
  return platformLabels[platform];
}

export function isSupportedPlatform(platform: SourcePlatform) {
  return supportedPlatforms.some((supported) => supported === platform);
}

export function parseSupportedPlatform(value: string | null | undefined) {
  return supportedPlatforms.find((platform) => platform === value);
}

function isDomain(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}
