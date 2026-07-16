import type { SourcePlatform } from "@prisma/client";

// Public engagement numbers captured for a saved post at fetch time. Only the
// keys a given platform exposes are populated; `fetchedAt` marks the snapshot.
export type EngagementMetrics = {
  like?: number;
  repost?: number;
  reply?: number;
  quote?: number;
  bookmark?: number;
  impression?: number;
  view?: number;
  score?: number;
  upvoteRatio?: number; // 0..1
  fetchedAt?: string;
};

// Returns the object only when it carries at least one numeric metric, so empty
// snapshots aren't stored or shown.
export function nonEmptyEngagement(
  metrics: EngagementMetrics,
): EngagementMetrics | undefined {
  const hasValue = Object.entries(metrics).some(
    ([key, value]) => key !== "fetchedAt" && typeof value === "number",
  );
  return hasValue ? metrics : undefined;
}

export type EngagementRow = { label: string; value: string };

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatCount(value: number): string {
  if (value >= 100_000_000) return `${trimZero(value / 100_000_000)}億`;
  if (value >= 10_000) return `${trimZero(value / 10_000)}万`;
  return value.toLocaleString("ja-JP");
}

// Per-platform: which numbers to show, in what order, with what labels. Only
// platforms whose public numbers are obtainable are handled; others return [].
export function engagementRows(
  platform: SourcePlatform,
  metrics: EngagementMetrics | null | undefined,
): EngagementRow[] {
  if (!metrics) return [];
  const rows: EngagementRow[] = [];
  const push = (label: string, value: number | undefined) => {
    if (typeof value === "number") {
      rows.push({ label, value: formatCount(value) });
    }
  };

  switch (platform) {
    case "X":
      push("表示", metrics.impression);
      push("いいね", metrics.like);
      push("リポスト", metrics.repost);
      push("返信", metrics.reply);
      push("引用", metrics.quote);
      push("ブックマーク", metrics.bookmark);
      break;
    case "BLUESKY":
      push("いいね", metrics.like);
      push("リポスト", metrics.repost);
      push("返信", metrics.reply);
      push("引用", metrics.quote);
      break;
    case "REDDIT":
      push("スコア", metrics.score);
      push("コメント", metrics.reply);
      if (typeof metrics.upvoteRatio === "number") {
        rows.push({
          label: "賛成率",
          value: `${Math.round(metrics.upvoteRatio * 100)}%`,
        });
      }
      break;
    case "YOUTUBE":
      push("視聴回数", metrics.view);
      break;
    default:
      break;
  }
  return rows;
}
