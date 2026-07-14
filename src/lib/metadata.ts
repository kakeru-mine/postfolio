import * as cheerio from "cheerio";
import type { SourcePlatform } from "@prisma/client";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { assertNotLiveBroadcast } from "@/lib/live-broadcast";
import { detectPlatform } from "@/lib/platform";
import { ensureSystemCa } from "@/lib/system-ca";
import { fetchXContent } from "@/lib/x-content";

ensureSystemCa();

function isPrivateAddress(address: string) {
  const value = address.toLowerCase();
  return (
    value.startsWith("10.") ||
    value.startsWith("127.") ||
    value.startsWith("169.254.") ||
    value.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(value) ||
    value === "::1" ||
    value === "::" ||
    value.startsWith("fc") ||
    value.startsWith("fd") ||
    value.startsWith("fe80:")
  );
}

async function assertPublicUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("公開された http(s) URL を入力してください。");
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local")) {
    throw new Error("公開されたURLを入力してください。");
  }

  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("公開されたURLを入力してください。");
  }
}

function content($: cheerio.CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).first().attr("content")?.trim();
    if (value) return value;
  }
  return undefined;
}

function dateContent($: cheerio.CheerioAPI) {
  const value = content($, [
    'meta[property="article:published_time"]',
    'meta[name="article:published_time"]',
    'meta[name="date"]',
    'meta[name="publish-date"]',
    'meta[itemprop="datePublished"]',
    'meta[itemprop="uploadDate"]',
  ]);
  const date = value ? new Date(value) : undefined;
  if (date && !Number.isNaN(date.getTime())) return date;

  const timeValue = $("time[datetime]").first().attr("datetime")?.trim();
  const timeDate = timeValue ? new Date(timeValue) : undefined;
  if (timeDate && !Number.isNaN(timeDate.getTime())) return timeDate;

  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const parsed = JSON.parse($(element).text()) as unknown;
      const publishedAt = findPublishedDate(parsed);
      if (publishedAt) return publishedAt;
    } catch {
      // Ignore invalid structured data and continue with other blocks.
    }
  }

  return undefined;
}

function findPublishedDate(value: unknown): Date | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const date = findPublishedDate(item);
      if (date) return date;
    }
    return undefined;
  }

  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["datePublished", "uploadDate", "dateCreated"]) {
    if (typeof record[key] === "string") {
      const date = new Date(record[key]);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const date = findPublishedDate(nestedValue);
    if (date) return date;
  }
  return undefined;
}

type PlatformMetadata = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  authorName?: string;
  publishedAt?: Date;
  postText?: string;
  mediaUrls?: string[];
};

type FetchedMetadata = {
  title: string | undefined;
  description: string | undefined;
  thumbnailUrl: string | undefined;
  authorName: string | undefined;
  publishedAt: Date | undefined;
  postText?: string;
  mediaUrls?: string[];
  domain: string;
  sourcePlatform: SourcePlatform;
};

function hasMetadata(metadata: PlatformMetadata) {
  return Boolean(
    metadata.title ||
      metadata.description ||
      metadata.thumbnailUrl ||
      metadata.authorName ||
      metadata.publishedAt ||
      metadata.postText ||
      metadata.mediaUrls?.length,
  );
}

function mergePlatformMetadata(
  base: PlatformMetadata,
  override: PlatformMetadata,
): PlatformMetadata {
  return {
    title: override.title || base.title,
    description: override.description || base.description,
    thumbnailUrl: override.thumbnailUrl || base.thumbnailUrl,
    authorName: override.authorName || base.authorName,
    publishedAt: override.publishedAt || base.publishedAt,
    postText: override.postText || base.postText,
    mediaUrls: override.mediaUrls?.length ? override.mediaUrls : base.mediaUrls,
  };
}

async function fetchDiscoveredOEmbed(
  $: cheerio.CheerioAPI,
  pageUrl: URL,
): Promise<PlatformMetadata> {
  const href = $(
    'link[rel="alternate"][type="application/json+oembed"]',
  )
    .first()
    .attr("href");
  if (!href) return {};

  try {
    const oEmbedUrl = new URL(href, pageUrl);
    await assertPublicUrl(oEmbedUrl);
    const response = await fetch(oEmbedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return {};

    const result = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      html?: string;
    };
    const embedText = result.html
      ? cheerio.load(result.html).text().replace(/\s+/g, " ").trim()
      : undefined;

    return {
      title: cleanMetadataValue(result.title),
      description: cleanMetadataValue(result.title),
      authorName: cleanMetadataValue(result.author_name),
      thumbnailUrl: result.thumbnail_url?.trim() || undefined,
      postText: cleanMetadataValue(embedText || result.title),
      mediaUrls: result.thumbnail_url ? [result.thumbnail_url] : [],
    };
  } catch {
    return {};
  }
}

async function fetchYouTubeMetadata(
  url: URL,
  html: string,
): Promise<PlatformMetadata> {
  const videoId = extractYouTubeVideoId(url);
  const videoThumbnailUrl = videoId
    ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    : undefined;
  const metadata: PlatformMetadata = {
    ...extractYouTubeHtmlMetadata(html),
    publishedAt: html ? extractYouTubePublishedAt(html) : undefined,
  };
  metadata.thumbnailUrl = metadata.thumbnailUrl || videoThumbnailUrl;
  metadata.mediaUrls =
    metadata.mediaUrls?.length || !metadata.thumbnailUrl
      ? metadata.mediaUrls
      : [metadata.thumbnailUrl];

  try {
    const oEmbedUrl = new URL("https://www.youtube.com/oembed");
    oEmbedUrl.searchParams.set("url", url.toString());
    oEmbedUrl.searchParams.set("format", "json");
    const response = await fetch(oEmbedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) {
      const result = (await response.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
      };
      metadata.title = cleanMetadataValue(result.title) || metadata.title;
      metadata.description =
        cleanMetadataValue(result.title) || metadata.description;
      metadata.authorName =
        cleanMetadataValue(result.author_name) || metadata.authorName;
      metadata.thumbnailUrl =
        result.thumbnail_url?.trim() || metadata.thumbnailUrl;
      metadata.postText = cleanMetadataValue(result.title) || metadata.postText;
      metadata.mediaUrls = result.thumbnail_url
        ? [result.thumbnail_url]
        : metadata.mediaUrls;
    }
  } catch {
    // The page metadata is still useful when oEmbed is temporarily unavailable.
  }

  return metadata;
}

function extractYouTubeVideoId(url: URL) {
  if (url.hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0];
  }

  const watchVideoId = url.searchParams.get("v");
  if (watchVideoId) return watchVideoId;

  const pathVideoId = url.pathname.match(
    /^\/(?:shorts|embed|live)\/([^/?#]+)/,
  )?.[1];
  return pathVideoId;
}

function extractYouTubeHtmlMetadata(html: string): PlatformMetadata {
  if (!html) return {};

  // Use only sources tied to the main video. `shortBylineText` is avoided: it
  // also appears on every recommended-video thumbnail, whose order changes per
  // request, which made the author flip between re-fetches.
  const authorName = cleanAuthorName(
    decodeJsonString(
      html.match(/"ownerChannelName"\s*:\s*"([^"]+)"/)?.[1] ||
        html.match(
          /playerOverlayVideoDetailsRenderer"\s*:\s*{[\s\S]{0,800}?"subtitle"\s*:\s*{\s*"runs"\s*:\s*\[\s*{\s*"text"\s*:\s*"([^"]+)"/,
        )?.[1] ||
        html.match(/"videoOwnerChannelName"\s*:\s*"([^"]+)"/)?.[1] ||
        html.match(
          /videoSecondaryInfoRenderer"\s*:\s*{[\s\S]{0,2000}?"ownerText"\s*:\s*{[\s\S]{0,400}?"text"\s*:\s*"([^"]+)"/,
        )?.[1],
    ),
  );
  // The plain string `videoDetails.title` isn't always present in the HTML
  // returned to bots; fall back to the renderer titles (kept as objects). The
  // span after `"videoDetails"` is short so it can't skip ahead to an unrelated
  // `"title":"…"` (which previously produced bogus titles like "16").
  const title = cleanMetadataValue(
    decodeJsonString(
      html.match(
        /"videoDetails"\s*:\s*{[\s\S]{0,300}?"title"\s*:\s*"((?:[^"\\]|\\.)+)"/,
      )?.[1] ||
        html.match(
          /playerOverlayVideoDetailsRenderer"\s*:\s*{[\s\S]{0,400}?"title"\s*:\s*{\s*"simpleText"\s*:\s*"((?:[^"\\]|\\.)+)"/,
        )?.[1] ||
        html.match(
          /playerMicroformatRenderer"\s*:\s*{[\s\S]{0,2000}?"title"\s*:\s*{\s*"simpleText"\s*:\s*"((?:[^"\\]|\\.)+)"/,
        )?.[1],
    ),
  );
  const thumbnailUrl = normalizeMetadataUrl(
    decodeJsonString(
      html.match(
        /"videoDetails"\s*:\s*{[\s\S]{0,5000}?"thumbnail"\s*:\s*{[\s\S]{0,1200}?"url"\s*:\s*"([^"]+)"/,
      )?.[1] ||
        html.match(/"thumbnailUrl"\s*:\s*\[\s*"([^"]+)"/)?.[1] ||
        html.match(/"thumbnail"\s*:\s*{[\s\S]{0,1200}?"url"\s*:\s*"([^"]+)"/)
          ?.[1],
    ),
  );

  return {
    title,
    description: title,
    authorName,
    thumbnailUrl,
    postText: title,
    mediaUrls: thumbnailUrl ? [thumbnailUrl] : [],
  };
}

function extractYouTubePublishedAt(html: string) {
  for (const pattern of [
    /"publishDate"\s*:\s*"([^"]+)"/,
    /"uploadDate"\s*:\s*"([^"]+)"/,
    /"dateText"\s*:\s*{[\s\S]{0,600}?"simpleText"\s*:\s*"([^"]+)"/,
    /itemprop="datePublished"\s+content="([^"]+)"/,
    /itemprop="uploadDate"\s+content="([^"]+)"/,
  ]) {
    const value = html.match(pattern)?.[1];
    if (!value) continue;
    const date = parseYouTubePublishedDate(value);
    if (date) return date;
  }
  return undefined;
}

function parseYouTubePublishedDate(value: string) {
  const cleaned = decodeJsonString(value)
    ?.replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return undefined;

  const date = new Date(cleaned);
  if (!Number.isNaN(date.getTime())) return date;

  const numericDate =
    cleaned.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/) ||
    cleaned.match(/(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日/);
  if (!numericDate) return undefined;

  const year = Number(numericDate[1]);
  const month = Number(numericDate[2]);
  const day = Number(numericDate[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

async function fetchTikTokMetadata(
  url: URL,
  html: string,
): Promise<PlatformMetadata> {
  const publishedAt = extractTikTokPublishedAt(url, html);

  try {
    const oEmbedUrl = new URL("https://www.tiktok.com/oembed");
    oEmbedUrl.searchParams.set("url", url.toString());
    const response = await fetch(oEmbedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return {};

    const result = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      html?: string;
    };
    const embedText = result.html
      ? cheerio.load(result.html).text().replace(/\s+/g, " ").trim()
      : undefined;
    return {
      title: result.title?.trim() || undefined,
      description: result.title?.trim() || undefined,
      authorName: result.author_name?.trim() || undefined,
      publishedAt,
      thumbnailUrl: result.thumbnail_url?.trim() || undefined,
      postText: cleanMetadataValue(embedText || result.title),
      mediaUrls: result.thumbnail_url ? [result.thumbnail_url] : [],
    };
  } catch {
    return { publishedAt };
  }
}

function extractTikTokPublishedAt(url: URL, html: string) {
  const videoId = url.pathname.match(/\/video\/(\d+)/)?.[1];
  if (!videoId) return undefined;

  const escapedVideoId = videoId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const createTime = html.match(
    new RegExp(
      `"id"\\s*:\\s*"${escapedVideoId}"[\\s\\S]{0,3000}?"createTime"\\s*:\\s*"?([0-9]{10})"?`,
    ),
  )?.[1];
  const seconds = createTime
    ? Number(createTime)
    : Number(BigInt(videoId) / BigInt(4_294_967_296));
  const publishedAt = new Date(seconds * 1000);

  if (
    Number.isNaN(publishedAt.getTime()) ||
    publishedAt.getUTCFullYear() < 2016 ||
    publishedAt.getTime() > Date.now() + 24 * 60 * 60 * 1000
  ) {
    return undefined;
  }

  return publishedAt;
}

async function fetchInstagramOEmbedMetadata(
  url: URL,
): Promise<PlatformMetadata> {
  const accessToken = process.env.INSTAGRAM_OEMBED_ACCESS_TOKEN;
  if (!accessToken) return {};

  try {
    const oEmbedUrl = new URL("https://graph.facebook.com/v21.0/instagram_oembed");
    oEmbedUrl.searchParams.set("url", url.toString());
    oEmbedUrl.searchParams.set(
      "fields",
      "thumbnail_url,author_name,provider_name,provider_url",
    );
    oEmbedUrl.searchParams.set("access_token", accessToken);
    const response = await fetch(oEmbedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return {};

    const result = (await response.json()) as {
      thumbnail_url?: string;
      author_name?: string;
    };

    return {
      thumbnailUrl: result.thumbnail_url?.trim() || undefined,
      mediaUrls: result.thumbnail_url ? [result.thumbnail_url] : [],
      authorName: result.author_name ? `@${result.author_name.trim()}` : undefined,
    };
  } catch {
    return {};
  }
}

function extractInstagramMetadata(
  $: cheerio.CheerioAPI,
): PlatformMetadata {
  const title = cleanMetadataValue(
    content($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']),
  );
  const postText = cleanMetadataValue(
    content($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
  );
  const displayName = title
    ?.match(/^(.+?)\s+(?:on|-)\s+Instagram(?::|$)/i)?.[1]
    ?.trim();
  const username =
    postText
      ?.match(/\bcomments?\s*-\s*([a-z0-9._]+)(?=\s+on\b|:|$)/i)?.[1]
      ?.trim() ||
    content($, ['meta[name="twitter:title"]'])
      ?.match(/Instagram\s*\(@([a-z0-9._]+)\)/i)?.[1]
      ?.trim() ||
    content($, ['meta[name="twitter:title"]'])
      ?.match(/\(@([a-z0-9._]+)\)/i)?.[1]
      ?.trim();
  const authorName =
    displayName && username
      ? `${displayName} (@${username})`
      : displayName || (username ? `@${username}` : undefined);
  const thumbnailUrl = content($, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ]);

  return {
    title,
    description: postText,
    postText,
    authorName,
    thumbnailUrl,
    mediaUrls: thumbnailUrl ? [thumbnailUrl] : [],
  };
}

function extractThreadsMetadata(
  $: cheerio.CheerioAPI,
  html = "",
): PlatformMetadata {
  const title = cleanMetadataValue(
    content($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']),
  );
  const postText = cleanMetadataValue(
    content($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
  );
  const authorMatch =
    title?.match(/^(.+?)\s+\(@([^)]+)\)\s+on Threads(?:\s*\|.*)?$/i) ||
    title?.match(/^(.+?)\s+on Threads(?:\s*\|.*)?$/i);
  const twitterCreator = cleanAuthorName(
    content($, ['meta[name="twitter:creator"]']),
  );
  const authorName = authorMatch
    ? authorMatch[2]
      ? `${authorMatch[1].trim()} (@${authorMatch[2].trim()})`
      : authorMatch[1].trim()
    : twitterCreator;
  const thumbnailUrl = findThreadsThumbnailUrl($, html);

  return {
    title,
    description: postText,
    postText,
    authorName,
    thumbnailUrl,
    mediaUrls: thumbnailUrl ? [thumbnailUrl] : [],
  };
}

function extractSubstackMetadata(
  $: cheerio.CheerioAPI,
  url: URL,
  html: string,
): PlatformMetadata {
  const title = cleanMetadataValue(
    content($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']),
  );
  const description = cleanMetadataValue(
    content($, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]),
  );
  const thumbnailUrl = content($, [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
  ]);
  const handle = extractSubstackHandle(url);

  return {
    title,
    description,
    thumbnailUrl,
    authorName: findSubstackAuthorName($, html, handle),
    publishedAt: findSubstackPublishedAt($, html),
    postText: description,
    mediaUrls: thumbnailUrl ? [thumbnailUrl] : [],
  };
}

function extractSubstackHandle(url: URL) {
  const pathHandle = url.pathname.match(/\/@([^/]+)/)?.[1];
  if (pathHandle) return pathHandle.trim();

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (host.endsWith(".substack.com")) {
    const subdomain = host.replace(/\.substack\.com$/, "");
    if (subdomain && subdomain !== "www") return subdomain;
  }
  return undefined;
}

function findSubstackAuthorName(
  $: cheerio.CheerioAPI,
  html: string,
  handle: string | undefined,
) {
  const directAuthor =
    cleanAuthorName(
      content($, [
        'meta[name="author"]',
        'meta[property="article:author"]',
        'meta[name="twitter:creator"]',
      ]),
    ) || cleanAuthorName(findAuthorNameFromStructuredData($));
  if (directAuthor) return formatSubstackAuthor(directAuthor, handle);

  const normalizedHtml = normalizeEmbeddedJsonText(html);
  const escapedHandle = handle?.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const candidates = [
    ...(escapedHandle
      ? [
          new RegExp(
            `"handle"\\s*:\\s*"${escapedHandle}"[\\s\\S]{0,1800}?"name"\\s*:\\s*"([^"]+)"`,
            "i",
          ),
          new RegExp(
            `"name"\\s*:\\s*"([^"]+)"[\\s\\S]{0,1800}?"handle"\\s*:\\s*"${escapedHandle}"`,
            "i",
          ),
          new RegExp(
            `"username"\\s*:\\s*"${escapedHandle}"[\\s\\S]{0,1800}?"name"\\s*:\\s*"([^"]+)"`,
            "i",
          ),
          new RegExp(
            `"name"\\s*:\\s*"([^"]+)"[\\s\\S]{0,1800}?"username"\\s*:\\s*"${escapedHandle}"`,
            "i",
          ),
        ]
      : []),
    /"author_name"\s*:\s*"([^"]+)"/i,
    /"author"\s*:\s*{[\s\S]{0,1800}?"name"\s*:\s*"([^"]+)"/i,
    /"user"\s*:\s*{[\s\S]{0,1800}?"name"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of candidates) {
    const value = cleanAuthorName(
      decodeJsonString(normalizedHtml.match(pattern)?.[1]),
    );
    if (value) return formatSubstackAuthor(value, handle);
  }

  return handle ? `@${handle}` : undefined;
}

function formatSubstackAuthor(name: string, handle: string | undefined) {
  if (!handle) return name;
  if (name.toLowerCase() === handle.toLowerCase()) return `@${handle}`;
  if (name.includes(`@${handle}`)) return name;
  return `${name} (@${handle})`;
}

function findSubstackPublishedAt($: cheerio.CheerioAPI, html: string) {
  const genericDate = dateContent($);
  if (genericDate) return genericDate;

  const normalizedHtml = normalizeEmbeddedJsonText(html);
  const stringDatePattern =
    /"(?:published_at|publishedAt|post_date|postDate|publication_date|publicationDate|created_at|createdAt|date)"\s*:\s*"([^"]+)"/gi;
  for (const match of normalizedHtml.matchAll(stringDatePattern)) {
    const date = parseValidDate(decodeJsonString(match[1]));
    if (date) return date;
  }

  const numericDatePattern =
    /"(?:published_at|publishedAt|post_date|postDate|publication_date|publicationDate|created_at|createdAt|date)"\s*:\s*(\d{10,13})/gi;
  for (const match of normalizedHtml.matchAll(numericDatePattern)) {
    const numberValue = Number(match[1]);
    const milliseconds =
      numberValue < 10_000_000_000 ? numberValue * 1000 : numberValue;
    const date = parseValidDate(milliseconds);
    if (date) return date;
  }

  return undefined;
}

function normalizeEmbeddedJsonText(value: string) {
  return value
    .replace(/\\"/g, '"')
    .replace(/\\u002F/g, "/")
    .replace(/\\u003C/g, "<")
    .replace(/\\u003E/g, ">")
    .replace(/\\u0026/g, "&");
}

function decodeJsonString(value: string | undefined) {
  if (!value) return undefined;
  try {
    return JSON.parse(`"${value.replace(/"/g, '\\"')}"`) as string;
  } catch {
    return value;
  }
}

function normalizeMetadataUrl(value: string | undefined) {
  const cleaned = value
    ?.replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .trim();
  if (!cleaned || !/^https?:\/\//i.test(cleaned)) return undefined;
  return cleaned;
}

function cleanCanonicalUrl(value: string | undefined) {
  const cleaned = value?.trim();
  if (!cleaned) return undefined;
  if (["undefined", "null", "#"].includes(cleaned.toLowerCase())) {
    return undefined;
  }
  return cleaned;
}

function parseValidDate(value: string | number | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  if (date.getUTCFullYear() < 2000) return undefined;
  if (date.getTime() > Date.now() + 24 * 60 * 60 * 1000) return undefined;
  return date;
}

async function fetchThreadsPreviewMetadata(
  url: URL,
): Promise<PlatformMetadata> {
  for (const userAgent of [
    "Twitterbot/1.0",
    "facebookexternalhit/1.1",
    "Mozilla/5.0 (compatible; PostfolioBot/0.1; +https://example.com)",
  ]) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) continue;

      const type = response.headers.get("content-type") ?? "";
      if (!type.includes("text/html")) continue;

      const html = (await response.text()).slice(0, 2_000_000);
      const $ = cheerio.load(html);
      const metadata = extractThreadsMetadata($, html);
      if (hasMetadata(metadata)) return metadata;
    } catch {
      // Try the next preview user agent.
    }
  }
  return {};
}

function isThreadsProfileImage(url: string) {
  return (
    /profile_pic/i.test(url) ||
    /\/t51\.82787-19\//i.test(url) ||
    /\/t51\.2885-19\//i.test(url)
  );
}

function findThreadsThumbnailUrl($: cheerio.CheerioAPI, html: string) {
  const candidates = [
    content($, [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:image:secure_url"]',
    ]),
    ...Array.from(
      html.matchAll(
        /https?:\\?\/\\?\/[^"'<>\\\s]+(?:fbcdn|cdninstagram)[^"'<>\\\s]+/gi,
      ),
      (match) => match[0],
    ),
  ]
    .map((candidate) => normalizeMetadataUrl(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));

  const postImage = candidates.find(
    (candidate) =>
      !isThreadsProfileImage(candidate) && !isThreadsStaticAsset(candidate),
  );
  return postImage || undefined;
}

function isThreadsStaticAsset(url: string) {
  return /static\.cdninstagram\.com|rsrc\.php|\.svg(?:\?|$)/i.test(url);
}

type RedditPostData = {
  title?: string;
  selftext?: string;
  author?: string;
  created_utc?: number;
  thumbnail?: string;
  url_overridden_by_dest?: string;
  preview?: { images?: Array<{ source?: { url?: string } }> };
};

function extractRedditPost(data: unknown): RedditPostData | undefined {
  if (!Array.isArray(data)) return undefined;
  const listing = data[0] as
    | { data?: { children?: Array<{ data?: RedditPostData }> } }
    | undefined;
  return listing?.data?.children?.[0]?.data;
}

// Reddit exposes a public JSON view of any post by appending `.json` to its URL
// (no auth required), which yields far richer data than OGP: the post body
// (selftext), author, timestamp and preview image.
async function fetchRedditMetadata(url: URL): Promise<PlatformMetadata> {
  try {
    const jsonUrl = new URL(url.toString());
    jsonUrl.hash = "";
    jsonUrl.search = "";
    jsonUrl.pathname = `${jsonUrl.pathname.replace(/\/+$/, "")}.json`;
    await assertPublicUrl(jsonUrl);

    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "PostfolioBot/0.1 (+https://postfolioapp.com)",
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return {};

    const post = extractRedditPost(await response.json());
    if (!post) return {};

    const title = cleanMetadataValue(post.title);
    const body = cleanMetadataValue(post.selftext);
    const shortBody =
      body && body.length > 280 ? `${body.slice(0, 280).trimEnd()}…` : body;
    const longBody = body && body.length > 5000 ? body.slice(0, 5000) : body;

    const previewImage = post.preview?.images?.[0]?.source?.url;
    const linkedImage =
      post.url_overridden_by_dest &&
      /\.(?:jpg|jpeg|png|gif|webp)(?:\?|$)/i.test(post.url_overridden_by_dest)
        ? post.url_overridden_by_dest
        : undefined;
    const rawThumbnail =
      previewImage ||
      linkedImage ||
      (typeof post.thumbnail === "string" && /^https?:\/\//.test(post.thumbnail)
        ? post.thumbnail
        : undefined);
    // Reddit JSON encodes `&` as `&amp;` inside image URLs; decode before use.
    const thumbnailUrl = normalizeMetadataUrl(
      rawThumbnail?.replace(/&amp;/g, "&"),
    );

    return {
      title,
      description: shortBody || title,
      authorName: post.author ? `u/${post.author}` : undefined,
      publishedAt:
        typeof post.created_utc === "number"
          ? parseValidDate(post.created_utc * 1000)
          : undefined,
      thumbnailUrl,
      postText: longBody || title,
      mediaUrls: thumbnailUrl ? [thumbnailUrl] : [],
    };
  } catch {
    return {};
  }
}

async function fetchPlatformFallbackMetadata(
  url: URL,
  sourcePlatform = detectPlatform(url.hostname),
): Promise<FetchedMetadata | undefined> {
  const metadata =
    sourcePlatform === "YOUTUBE"
      ? await fetchYouTubeMetadata(url, "")
      : sourcePlatform === "THREADS"
        ? await fetchThreadsPreviewMetadata(url)
        : sourcePlatform === "REDDIT"
          ? await fetchRedditMetadata(url)
          : {};

  if (!hasMetadata(metadata)) return undefined;

  return {
    title: metadata.title,
    description: metadata.description,
    thumbnailUrl: metadata.thumbnailUrl,
    authorName: metadata.authorName,
    publishedAt: metadata.publishedAt,
    postText: metadata.postText,
    mediaUrls: metadata.mediaUrls || [],
    domain: url.hostname.replace(/^www\./, ""),
    sourcePlatform,
  };
}

export async function fetchUrlMetadata(rawUrl: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    let url = new URL(rawUrl);
    let response: Response | undefined;

    for (let redirectCount = 0; redirectCount <= 4; redirectCount += 1) {
      await assertPublicUrl(url);
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PostfolioBot/0.1; +https://example.com)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });

      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const location = response.headers.get("location");
      if (!location || redirectCount === 4) {
        throw new Error("リダイレクト先を取得できませんでした。");
      }
      url = new URL(location, url);
    }

    if (!response) throw new Error("ページ情報を取得できませんでした。");

    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.includes("text/html")) {
      const fallbackMetadata = await fetchPlatformFallbackMetadata(url);
      if (fallbackMetadata) return fallbackMetadata;
      throw new Error("ページ情報を取得できませんでした。");
    }

    const html = (await response.text()).slice(0, 4_000_000);
    const $ = cheerio.load(html);
    const canonical = cleanCanonicalUrl($('link[rel="canonical"]').attr("href"));
    const finalUrl = new URL(canonical || url.toString(), url);
    const sourcePlatform = detectPlatform(finalUrl.hostname);
    // Reject broadcasts that are airing or scheduled (YouTube live/premiere,
    // TikTok LIVE, X Spaces/Broadcasts, Instagram Live). Ended archives pass.
    await assertNotLiveBroadcast(finalUrl, sourcePlatform, html);
    const enrichedContent =
      sourcePlatform === "X" ? await fetchXContent(finalUrl.toString()) : null;
    const youTubeMetadata =
      sourcePlatform === "YOUTUBE"
        ? await fetchYouTubeMetadata(finalUrl, html)
        : null;
    const platformMetadata =
      sourcePlatform === "TIKTOK"
        ? await fetchTikTokMetadata(finalUrl, html)
        : sourcePlatform === "INSTAGRAM"
          ? {
              ...extractInstagramMetadata($),
              ...(await fetchInstagramOEmbedMetadata(finalUrl)),
            }
        : sourcePlatform === "THREADS"
          ? mergePlatformMetadata(
              extractThreadsMetadata($, html),
              await fetchThreadsPreviewMetadata(finalUrl),
            )
        : sourcePlatform === "SUBSTACK"
          ? extractSubstackMetadata($, finalUrl, html)
        : sourcePlatform === "REDDIT"
          ? await fetchRedditMetadata(finalUrl)
          : {};
    const discoveredMetadata = await fetchDiscoveredOEmbed($, finalUrl);
    const structuredAuthorName = findAuthorNameFromStructuredData($);

    const title =
      youTubeMetadata?.title ||
      platformMetadata.title ||
      discoveredMetadata.title ||
      cleanMetadataValue(
        content($, ['meta[property="og:title"]', 'meta[name="twitter:title"]']),
      ) ||
      cleanMetadataValue($("title").first().text());
    const description =
      youTubeMetadata?.description ||
      platformMetadata.description ||
      discoveredMetadata.description ||
      cleanMetadataValue(
        content($, [
          'meta[property="og:description"]',
          'meta[name="twitter:description"]',
          'meta[name="description"]',
        ]),
      );
    const fallbackThumbnailUrl =
      youTubeMetadata?.thumbnailUrl ||
      discoveredMetadata.thumbnailUrl ||
      content($, [
        'meta[property="og:image"]',
        'meta[name="twitter:image"]',
      ]);
    const thumbnailUrl =
      platformMetadata.thumbnailUrl ||
      (sourcePlatform === "THREADS" &&
      fallbackThumbnailUrl &&
      isThreadsProfileImage(fallbackThumbnailUrl)
        ? undefined
        : fallbackThumbnailUrl);

    return {
      title,
      description,
      thumbnailUrl,
      authorName:
        enrichedContent?.authorName ||
        youTubeMetadata?.authorName ||
        platformMetadata.authorName ||
        structuredAuthorName ||
        cleanAuthorName(discoveredMetadata.authorName) ||
        cleanAuthorName(
          content($, [
            'meta[name="author"]',
            'meta[property="article:author"]',
            'link[itemprop="name"]',
          ]),
        ),
      publishedAt:
        enrichedContent?.publishedAt ||
        youTubeMetadata?.publishedAt ||
        platformMetadata.publishedAt ||
        dateContent($),
      domain: finalUrl.hostname.replace(/^www\./, ""),
      sourcePlatform,
      postText:
        enrichedContent?.postText ||
        youTubeMetadata?.postText ||
        platformMetadata.postText ||
        discoveredMetadata.postText ||
        description,
      mediaUrls:
        enrichedContent?.mediaUrls?.length
          ? enrichedContent.mediaUrls
          : youTubeMetadata?.mediaUrls?.length
            ? youTubeMetadata.mediaUrls
          : platformMetadata.mediaUrls?.length
            ? platformMetadata.mediaUrls
            : discoveredMetadata.mediaUrls?.length
              ? discoveredMetadata.mediaUrls
            : thumbnailUrl
              ? [thumbnailUrl]
              : [],
      ...(enrichedContent
        ? {
            ...enrichedContent,
            postText: enrichedContent.postText || description,
            mediaUrls:
              enrichedContent.mediaUrls.length > 0
                ? enrichedContent.mediaUrls
                : thumbnailUrl
                  ? [thumbnailUrl]
                  : [],
          }
        : {}),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function cleanMetadataValue(value: string | undefined) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  if (
    [
      /please wait for verification/i,
      /log in or sign up/i,
      /^login\b/i,
      /^log in\b/i,
      /security verification/i,
      /access denied/i,
    ].some((pattern) => pattern.test(cleaned))
  ) {
    return undefined;
  }
  return cleaned;
}

function cleanAuthorName(value: string | undefined) {
  const cleaned = cleanMetadataValue(value);
  if (!cleaned) return undefined;

  if (
    [
      "Substack",
      "Instagram",
      "Facebook",
      "Threads",
      "TikTok",
      "LinkedIn",
      "Reddit",
      "YouTube",
    ].some((service) => cleaned.toLowerCase() === service.toLowerCase())
  ) {
    return undefined;
  }

  return cleaned;
}

function findAuthorNameFromStructuredData($: cheerio.CheerioAPI) {
  for (const element of $('script[type="application/ld+json"]').toArray()) {
    try {
      const name = cleanAuthorName(
        findAuthorName(JSON.parse($(element).text()) as unknown),
      );
      if (name) return name;
    } catch {
      // Ignore invalid structured data and continue with other blocks.
    }
  }
  return undefined;
}

function findAuthorName(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const name = findAuthorName(item);
      if (name) return name;
    }
    return undefined;
  }
  if (!value || typeof value !== "object") return undefined;

  const record = value as Record<string, unknown>;
  const author = record.author;
  if (typeof author === "string") return author.trim() || undefined;
  if (author && typeof author === "object") {
    const name = (author as Record<string, unknown>).name;
    if (typeof name === "string") return name.trim() || undefined;
  }

  for (const nestedValue of Object.values(record)) {
    const name = findAuthorName(nestedValue);
    if (name) return name;
  }
  return undefined;
}
