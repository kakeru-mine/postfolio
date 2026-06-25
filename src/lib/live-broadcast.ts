import type { SourcePlatform } from "@prisma/client";

/**
 * Thrown when a URL points to a live broadcast that is currently airing or has
 * not started yet (YouTube live/premiere, TikTok LIVE, X Spaces/Broadcasts,
 * Instagram Live, ...). These have no stable content to capture — only ended
 * archives should be saved.
 */
export class LiveBroadcastError extends Error {
  constructor(
    message = "ライブ配信中・配信予定の投稿は保存できません。配信が終了したアーカイブのURLを保存してください。",
  ) {
    super(message);
    this.name = "LiveBroadcastError";
  }
}

// YouTube embeds ytInitialPlayerResponse in the watch HTML. `isLive` /
// `isLiveNow` / `isUpcoming` are only true while a stream is airing or
// scheduled; an ended archive reports them as false (with `isLiveContent` still
// true), so matching the exact `"isLive"` key avoids blocking archives.
function isYouTubeLiveOrUpcoming(html: string) {
  if (!html) return false;
  return (
    /"isLive"\s*:\s*true/.test(html) ||
    /"isLiveNow"\s*:\s*true/.test(html) ||
    /"isUpcoming"\s*:\s*true/.test(html) ||
    /"status"\s*:\s*"LIVE_STREAM_OFFLINE"/.test(html)
  );
}

// TikTok LIVE rooms live at /@user/live and only exist while airing.
function isTikTokLive(url: URL) {
  return /\/live\/?$/i.test(url.pathname);
}

// X live formats: audio Spaces (/i/spaces/...) and video Broadcasts
// (/i/broadcasts/...). Regular posts use /<user>/status/<id>.
function isXLive(url: URL) {
  return /^\/i\/(spaces|broadcasts)\//i.test(url.pathname);
}

// Instagram Live broadcasts surface under a /live/ path segment. Regular posts
// use /p/, /reel/ or /tv/, which never contain /live/.
function isInstagramLive(url: URL) {
  return /\/live(\/|$)/i.test(url.pathname);
}

/**
 * Throws {@link LiveBroadcastError} when the URL is a live / upcoming broadcast.
 * `html` is only needed for YouTube; pass an empty string for a URL-only check.
 */
export function assertNotLiveBroadcast(
  url: URL,
  sourcePlatform: SourcePlatform,
  html: string,
) {
  const isLive =
    (sourcePlatform === "YOUTUBE" && isYouTubeLiveOrUpcoming(html)) ||
    (sourcePlatform === "TIKTOK" && isTikTokLive(url)) ||
    (sourcePlatform === "X" && isXLive(url)) ||
    (sourcePlatform === "INSTAGRAM" && isInstagramLive(url));

  if (isLive) throw new LiveBroadcastError();
}
