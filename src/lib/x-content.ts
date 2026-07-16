import * as cheerio from "cheerio";
import { nonEmptyEngagement, type EngagementMetrics } from "@/lib/engagement";

type XUser = {
  id: string;
  name?: string;
  username?: string;
};

type XMedia = {
  media_key: string;
  type?: string;
  url?: string;
  preview_image_url?: string;
  alt_text?: string;
};

type XPost = {
  id: string;
  text?: string;
  note_tweet?: { text?: string };
  author_id?: string;
  conversation_id?: string;
  created_at?: string;
  public_metrics?: {
    retweet_count?: number;
    reply_count?: number;
    like_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
  attachments?: { media_keys?: string[] };
  referenced_tweets?: Array<{
    type: "retweeted" | "quoted" | "replied_to";
    id: string;
  }>;
};

type XApiResponse = {
  data?: XPost | XPost[];
  includes?: {
    users?: XUser[];
    media?: XMedia[];
    tweets?: XPost[];
  };
  errors?: Array<{ detail?: string; title?: string }>;
};

export type EnrichedPostContent = {
  postText?: string;
  mediaUrls: string[];
  quotedPostText?: string;
  quotedPostAuthor?: string;
  threadTexts: string[];
  authorName?: string;
  publishedAt?: Date;
  contentFetchedAt: Date;
  engagement?: EngagementMetrics;
};

export function getXPostId(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (!["x.com", "www.x.com", "twitter.com", "www.twitter.com"].includes(url.hostname)) {
      return undefined;
    }
    return url.pathname.match(/\/status\/(\d+)/)?.[1];
  } catch {
    return undefined;
  }
}

export async function fetchXContent(
  rawUrl: string,
): Promise<EnrichedPostContent | null> {
  const postId = getXPostId(rawUrl);
  if (!postId) return null;

  const bearerToken = process.env.X_BEARER_TOKEN;
  if (bearerToken) {
    try {
      return await fetchFromXApi(postId, bearerToken);
    } catch (error) {
      console.warn("X API enrichment failed, falling back to oEmbed.", error);
    }
  }

  return fetchFromOEmbed(rawUrl);
}

async function fetchFromXApi(
  postId: string,
  bearerToken: string,
): Promise<EnrichedPostContent> {
  const params = new URLSearchParams({
    "tweet.fields":
      "attachments,author_id,conversation_id,created_at,note_tweet,public_metrics,referenced_tweets,text",
    expansions:
      "attachments.media_keys,author_id,referenced_tweets.id,referenced_tweets.id.author_id,referenced_tweets.id.attachments.media_keys",
    "media.fields": "alt_text,media_key,preview_image_url,type,url",
    "user.fields": "name,username",
  });
  const response = await fetch(
    `https://api.x.com/2/tweets/${postId}?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${bearerToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );
  const result = (await response.json()) as XApiResponse;
  if (!response.ok || !result.data || Array.isArray(result.data)) {
    throw new Error(
      result.errors?.[0]?.detail ||
        result.errors?.[0]?.title ||
        "X APIから投稿を取得できませんでした。",
    );
  }

  const post = result.data;
  const users = result.includes?.users ?? [];
  const media = result.includes?.media ?? [];
  const quotedReference = post.referenced_tweets?.find(
    (reference) => reference.type === "quoted",
  );
  const quotedPost = result.includes?.tweets?.find(
    (includedPost) => includedPost.id === quotedReference?.id,
  );
  const author = users.find((user) => user.id === post.author_id);
  const quotedAuthor = users.find((user) => user.id === quotedPost?.author_id);
  const mediaKeys = new Set([
    ...(post.attachments?.media_keys ?? []),
    ...(quotedPost?.attachments?.media_keys ?? []),
  ]);
  const mediaUrls = media
    .filter((item) => mediaKeys.has(item.media_key))
    .map((item) => item.url || item.preview_image_url)
    .filter((url): url is string => Boolean(url));

  const threadTexts = await fetchThreadTexts({
    post,
    author,
    bearerToken,
  });

  return {
    postText: appendPublicMetrics(post.note_tweet?.text || post.text, post.public_metrics),
    mediaUrls: [...new Set(mediaUrls)].slice(0, 10),
    quotedPostText: quotedPost?.note_tweet?.text || quotedPost?.text,
    quotedPostAuthor: formatAuthor(quotedAuthor),
    threadTexts,
    authorName: formatAuthor(author),
    publishedAt: parseDate(post.created_at),
    contentFetchedAt: new Date(),
    engagement: post.public_metrics
      ? nonEmptyEngagement({
          impression: post.public_metrics.impression_count,
          like: post.public_metrics.like_count,
          repost: post.public_metrics.retweet_count,
          reply: post.public_metrics.reply_count,
          quote: post.public_metrics.quote_count,
          bookmark: post.public_metrics.bookmark_count,
          fetchedAt: new Date().toISOString(),
        })
      : undefined,
  };
}

function appendPublicMetrics(
  text: string | undefined,
  metrics: XPost["public_metrics"],
) {
  if (!metrics) return text;
  const values = [
    ["表示", metrics.impression_count],
    ["いいね", metrics.like_count],
    ["リポスト", metrics.retweet_count],
    ["返信", metrics.reply_count],
    ["引用", metrics.quote_count],
    ["ブックマーク", metrics.bookmark_count],
  ]
    .filter(([, value]) => typeof value === "number")
    .map(([label, value]) => `${label}: ${value}`);

  if (!values.length) return text;
  return [text, `反応指標: ${values.join(" / ")}`].filter(Boolean).join("\n\n");
}

async function fetchThreadTexts({
  post,
  author,
  bearerToken,
}: {
  post: XPost;
  author?: XUser;
  bearerToken: string;
}) {
  if (!post.conversation_id || !author?.username) return [];

  const params = new URLSearchParams({
    query: `conversation_id:${post.conversation_id} from:${author.username}`,
    "tweet.fields": "author_id,conversation_id,created_at,note_tweet,text",
    max_results: "100",
  });

  try {
    const response = await fetch(
      `https://api.x.com/2/tweets/search/recent?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!response.ok) return [];

    const result = (await response.json()) as XApiResponse;
    const posts = Array.isArray(result.data) ? result.data : [];
    return posts
      .filter((item) => item.id !== post.id)
      .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))
      .map((item) => item.note_tweet?.text || item.text)
      .filter((text): text is string => Boolean(text))
      .slice(0, 20);
  } catch {
    return [];
  }
}

async function fetchFromOEmbed(
  rawUrl: string,
): Promise<EnrichedPostContent | null> {
  try {
    const params = new URLSearchParams({
      url: rawUrl,
      omit_script: "1",
      dnt: "1",
    });
    const response = await fetch(
      `https://publish.twitter.com/oembed?${params.toString()}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return null;

    const result = (await response.json()) as {
      html?: string;
      author_name?: string;
    };
    if (!result.html) return null;

    const $ = cheerio.load(result.html);
    const text = $("blockquote p").first().text().trim();
    const dateText = $("blockquote a").last().text().trim();
    return {
      postText: text || undefined,
      mediaUrls: [],
      threadTexts: [],
      authorName: result.author_name,
      publishedAt: parseDate(dateText),
      contentFetchedAt: new Date(),
    };
  } catch {
    return null;
  }
}

function formatAuthor(user?: XUser) {
  if (!user) return undefined;
  if (user.name && user.username) return `${user.name} (@${user.username})`;
  return user.name || (user.username ? `@${user.username}` : undefined);
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
