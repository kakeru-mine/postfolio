/**
 * Thrown when a URL points to an X post that X itself reports as unavailable —
 * a suspended account, a rules violation, a deleted post, or a protected
 * account. X returns only placeholder metadata for these ("This post is from a
 * suspended account.", "This post violated the X Rules.", ...), so fetching
 * would otherwise overwrite the stored post with an empty shell. We stop before
 * returning and surface the reason.
 */
export class PostUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostUnavailableError";
  }
}

const X_UNAVAILABLE_PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    // X returns a 404 page with this copy for deleted or missing posts.
    test: /could not be found or may have been deleted|Post Not Found/i,
    message: "この投稿は削除されたか、存在しないため取得できませんでした。",
  },
  {
    test: /from a suspended account/i,
    message: "このアカウントは凍結されているため、投稿を取得できませんでした。",
  },
  {
    test: /violated the (?:X|Twitter) Rules/i,
    message:
      "この投稿はXのルール違反により削除されているため、取得できませんでした。",
  },
  {
    test: /from an account that no longer exists/i,
    message: "この投稿のアカウントは存在しないため、取得できませんでした。",
  },
  {
    test: /deleted by (?:the )?(?:post|Tweet) author/i,
    message: "この投稿は投稿者により削除されているため、取得できませんでした。",
  },
  {
    test: /(?:post|Tweet) is unavailable/i,
    message: "この投稿は削除されたか非公開のため、取得できませんでした。",
  },
  {
    test: /limits who can (?:view|reply)|protected (?:account|Tweets)|account owner limits/i,
    message: "この投稿は非公開アカウントのため、取得できませんでした。",
  },
];

/**
 * Returns a Japanese reason when X's page metadata is one of the known
 * "unavailable" placeholders, or undefined for a normal post. Pass the scraped
 * og:description (and optionally the title) — a live post's description is the
 * author's own text and will not match these X system strings.
 */
export function detectXUnavailableReason(
  description: string | undefined,
  title?: string | undefined,
): string | undefined {
  const haystack = `${title ?? ""}\n${description ?? ""}`;
  for (const { test, message } of X_UNAVAILABLE_PATTERNS) {
    if (test.test(haystack)) return message;
  }
  return undefined;
}
