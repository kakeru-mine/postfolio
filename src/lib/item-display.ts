import { SourcePlatform } from "@prisma/client";
import { platformLabel } from "@/lib/platform";

// Platforms whose OG title is the post body (TikTok / Bluesky), a generic phrase
// (Pinterest) or the article title (Substack) rather than the author line. Cards
// and the detail view lead these with the captured author name so every saved
// item shows author info as its heading, like X / Threads / Instagram.
const AUTHOR_LED_PLATFORMS: SourcePlatform[] = [
  "TIKTOK",
  "BLUESKY",
  "PINTEREST",
  "SUBSTACK",
];

export function isAuthorLedPlatform(
  sourcePlatform: SourcePlatform,
  authorName: string | null | undefined,
): boolean {
  return AUTHOR_LED_PLATFORMS.includes(sourcePlatform) && Boolean(authorName);
}

// The heading shown as the largest text on a card / the detail view.
export function itemHeading(item: {
  sourcePlatform: SourcePlatform;
  authorName?: string | null;
  title?: string | null;
  domain?: string | null;
  url: string;
}): string {
  if (isAuthorLedPlatform(item.sourcePlatform, item.authorName)) {
    return `${item.authorName} on ${platformLabel(item.sourcePlatform)}`;
  }
  return item.title || item.domain || item.url;
}
