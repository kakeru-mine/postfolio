import type { SourcePlatform } from "@prisma/client";

/**
 * Thrown when a URL points to a live broadcast that is currently airing or has
 * not started yet (YouTube live/premiere, TikTok LIVE, X Spaces/Broadcasts,
 * Instagram Live, ...). These have no stable content to capture; only ended
 * broadcasts / archives should be saved.
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

// TikTok LIVE rooms live at /@user/live. The embedded data carries
// `liveRoomStatus`: 2 while the room is airing, 0/other when the streamer is
// offline. Block only the airing state so ended rooms stay saveable.
function isTikTokLiveNow(url: URL, html: string) {
  if (!/\/live\/?$/i.test(url.pathname)) return false;
  return /"liveRoomStatus"\s*:\s*2\b/.test(html);
}

function xSpaceId(url: URL) {
  return url.pathname.match(/^\/i\/spaces\/([A-Za-z0-9]+)/)?.[1];
}

function isXBroadcast(url: URL) {
  return /^\/i\/broadcasts\//i.test(url.pathname);
}

// X Spaces state can't be scraped from the bot-facing HTML, so we ask the API.
// "live"/"scheduled" are blocked; "ended" (a replay/recording) is allowed.
// When the token is missing or the lookup fails we can't tell, and we err on
// the side of letting recordings through.
async function isXSpaceLiveNow(spaceId: string) {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return false;

  try {
    const response = await fetch(
      `https://api.x.com/2/spaces/${spaceId}?space.fields=state`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return false;

    const result = (await response.json()) as { data?: { state?: string } };
    const state = result.data?.state?.toLowerCase();
    return state === "live" || state === "scheduled";
  } catch {
    return false;
  }
}

// Instagram Live broadcasts surface under a /live/ path segment. Regular posts
// use /p/, /reel/ or /tv/, which never contain /live/.
function isInstagramLive(url: URL) {
  return /\/live(\/|$)/i.test(url.pathname);
}

/**
 * Throws {@link LiveBroadcastError} when the URL is a live / upcoming broadcast.
 * `html` is the fetched page HTML (used for YouTube and TikTok); pass an empty
 * string when it isn't available yet.
 */
export async function assertNotLiveBroadcast(
  url: URL,
  sourcePlatform: SourcePlatform,
  html: string,
) {
  let isLive = false;

  if (sourcePlatform === "YOUTUBE") {
    isLive = isYouTubeLiveOrUpcoming(html);
  } else if (sourcePlatform === "TIKTOK") {
    isLive = isTikTokLiveNow(url, html);
  } else if (sourcePlatform === "INSTAGRAM") {
    isLive = isInstagramLive(url);
  } else if (sourcePlatform === "X") {
    if (isXBroadcast(url)) {
      // Live video broadcasts have no recoverable archive at this URL.
      isLive = true;
    } else {
      const spaceId = xSpaceId(url);
      isLive = spaceId ? await isXSpaceLiveNow(spaceId) : false;
    }
  }

  if (isLive) throw new LiveBroadcastError();
}
