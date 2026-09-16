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

// Pinterest's oEmbed returns a generic caption ("〇〇 さんのピンをぜひご覧ください" /
// "See 〇〇's Pins") for pins whose creator added no description. That text is
// identical across such pins and carries no information, so we treat it as no
// caption and let the thumbnail + author line distinguish the card instead of
// repeating the same boilerplate on every Pinterest item.
const PINTEREST_GENERIC_CAPTION_PATTERNS = [
  /ピンをぜひご覧ください/,
  /さんのピンを見てみましょう/,
  /'s Pins\b/i,
  /on Pinterest, the world/i,
];

export function isGenericPinterestCaption(
  sourcePlatform: SourcePlatform,
  text: string | null | undefined,
): boolean {
  if (sourcePlatform !== "PINTEREST" || !text) return false;
  return PINTEREST_GENERIC_CAPTION_PATTERNS.some((re) => re.test(text));
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

// Substack has two post types: long-form posts (have an article title, like
// note.com) and notes (short posts, like X). Notes have no article title, so
// Substack returns the author as the OG title — detect them so we show the note
// body instead of a redundant author line.
export function isSubstackNote(item: {
  sourcePlatform: SourcePlatform;
  title?: string | null;
  authorName?: string | null;
  url: string;
}): boolean {
  if (item.sourcePlatform !== "SUBSTACK") return false;
  if (/\/note\//.test(item.url)) return true;
  return Boolean(
    item.title &&
      item.authorName &&
      item.title.trim() === item.authorName.trim(),
  );
}

// The secondary line under the heading. For author-led items it is the post
// content (notes / TikTok / Bluesky / Pinterest) or the article title (Substack
// long-form posts); otherwise the description.
export function itemSubtitle(item: {
  sourcePlatform: SourcePlatform;
  authorName?: string | null;
  title?: string | null;
  description?: string | null;
  url: string;
}): string | null | undefined {
  if (!isAuthorLedPlatform(item.sourcePlatform, item.authorName)) {
    return item.description;
  }
  if (isSubstackNote(item)) return item.description;
  const subtitle = item.title || item.description;
  // Drop Pinterest's generic "See 〇〇's Pins" boilerplate so caption-less pins
  // show no redundant line rather than the same phrase on every card.
  if (isGenericPinterestCaption(item.sourcePlatform, subtitle)) return null;
  return subtitle;
}
