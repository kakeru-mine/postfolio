import { createHash } from "node:crypto";
import { ensureSystemCa } from "@/lib/system-ca";

ensureSystemCa();

// Threads / Instagram serve images from these CDNs with short-lived signed
// URLs (the `oe` query param is the expiry). Once that timestamp passes the URL
// returns 403 forever, so we have to re-host the bytes on our own storage.
const PERSIST_HOSTS = [/\.fbcdn\.net$/i, /\.cdninstagram\.com$/i];

const BUCKET = process.env.SUPABASE_MEDIA_BUCKET || "media";

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return undefined;
  return { url, key };
}

function publicUrlPrefix(config: { url: string; key: string }) {
  return `${config.url}/storage/v1/object/public/${BUCKET}/`;
}

/** True when the URL points at an image we previously re-hosted ourselves. */
export function isOwnStorageUrl(rawUrl: string) {
  const config = storageConfig();
  return Boolean(config) && rawUrl.startsWith(publicUrlPrefix(config!));
}

/** Best-effort removal of a previously re-hosted image from Supabase Storage. */
export async function deleteStoredImage(rawUrl: string) {
  const config = storageConfig();
  if (!config) return;

  const prefix = publicUrlPrefix(config);
  if (!rawUrl.startsWith(prefix)) return;
  const objectPath = rawUrl.slice(prefix.length).split("?")[0];
  if (!objectPath) return;

  try {
    await fetch(`${config.url}/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: "DELETE",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Cleanup is best-effort; a leftover object is harmless.
  }
}

function needsPersist(rawUrl: string) {
  try {
    const host = new URL(rawUrl).hostname;
    return PERSIST_HOSTS.some((pattern) => pattern.test(host));
  } catch {
    return false;
  }
}

function extensionFor(contentType: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

async function downloadImage(rawUrl: string) {
  const response = await fetch(rawUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: "https://www.threads.net/",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) return undefined;

  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) return undefined;

  const body = new Uint8Array(await response.arrayBuffer());
  if (!body.byteLength) return undefined;

  return { body, contentType };
}

/**
 * Downloads an expiring Threads/Instagram CDN image and re-hosts it on Supabase
 * Storage, returning a permanent public URL. URLs that don't need persisting
 * (other platforms) and any failure path return the original URL unchanged, so
 * the caller can always fall back to the live URL.
 */
export async function persistExternalImage(rawUrl: string): Promise<string> {
  if (!needsPersist(rawUrl)) return rawUrl;

  const config = storageConfig();
  if (!config) return rawUrl;

  try {
    const image = await downloadImage(rawUrl);
    if (!image) return rawUrl;

    // Key the stored object by the CDN path (filename), ignoring the signed
    // query string, so re-fetching the same image overwrites instead of
    // accumulating duplicates.
    const pathHash = createHash("sha256")
      .update(new URL(rawUrl).pathname)
      .digest("hex")
      .slice(0, 32);
    const objectPath = `threads/${pathHash}.${extensionFor(image.contentType)}`;

    const uploadResponse = await fetch(
      `${config.url}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: "POST",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          "Content-Type": image.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
          "x-upsert": "true",
        },
        body: image.body,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!uploadResponse.ok) return rawUrl;

    return `${config.url}/storage/v1/object/public/${BUCKET}/${objectPath}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Re-hosts the thumbnail and any media URLs in a fetched metadata object onto
 * permanent storage. Non-CDN URLs and unconfigured environments pass through
 * unchanged.
 */
export async function persistMetadataMedia<
  T extends { thumbnailUrl?: string; mediaUrls?: string[] },
>(metadata: T): Promise<T> {
  // The thumbnail is usually also the first media URL, so persist each distinct
  // URL once (in parallel) and reuse the result to avoid duplicate downloads.
  const uniqueUrls = new Set<string>();
  if (metadata.thumbnailUrl) uniqueUrls.add(metadata.thumbnailUrl);
  for (const url of metadata.mediaUrls ?? []) uniqueUrls.add(url);
  if (!uniqueUrls.size) return metadata;

  const persisted = new Map(
    await Promise.all(
      [...uniqueUrls].map(
        async (url) => [url, await persistExternalImage(url)] as const,
      ),
    ),
  );

  return {
    ...metadata,
    thumbnailUrl: metadata.thumbnailUrl
      ? persisted.get(metadata.thumbnailUrl) ?? metadata.thumbnailUrl
      : metadata.thumbnailUrl,
    mediaUrls: metadata.mediaUrls?.length
      ? metadata.mediaUrls.map((url) => persisted.get(url) ?? url)
      : metadata.mediaUrls,
  };
}
