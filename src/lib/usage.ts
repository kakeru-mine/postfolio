import { SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPlanDefinition, type PlanDefinition } from "@/lib/plans";

export function dailyPeriodKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll("-", "");
}

export function monthlyPeriodKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .replace("-", "");
}

export function currentPeriodKey(date = new Date()) {
  return monthlyPeriodKey(date);
}

function aiUsagePeriodKey(plan: PlanDefinition, date = new Date()) {
  return plan.aiLimitPeriod === "day"
    ? dailyPeriodKey(date)
    : monthlyPeriodKey(date);
}

export async function getUsageSummary(user: {
  id: string;
  plan: SubscriptionPlan;
}) {
  const limits = getPlanDefinition(user.plan);
  const periodKey = aiUsagePeriodKey(limits);
  const [savedItemCount, aiUsage] = await Promise.all([
    prisma.savedItem.count({ where: { userId: user.id } }),
    prisma.aiUsageMonth.findUnique({
      where: { userId_periodKey: { userId: user.id, periodKey } },
    }),
  ]);

  return {
    plan: limits,
    savedItemCount,
    aiAnalysisCount: aiUsage?.count ?? 0,
    periodKey,
  };
}

export async function assertCanSaveItem(user: {
  id: string;
  plan: SubscriptionPlan;
}) {
  const count = await prisma.savedItem.count({ where: { userId: user.id } });
  const plan = getPlanDefinition(user.plan);
  const limit = plan.savedItemLimit;
  if (count >= limit) {
    throw new UsageLimitError(
      `${plan.name}プランの保存枠上限（${limit}件）に達しています。現在の保存数は${count}件です。不要な投稿を削除するか、プラン一覧から保存枠の多いプランへ変更してください。`,
      "saved_items",
      { count, limit, planName: plan.name },
    );
  }
}

export async function reserveAiAnalysis(user: {
  id: string;
  plan: SubscriptionPlan;
}) {
  const plan = getPlanDefinition(user.plan);
  const periodKey = aiUsagePeriodKey(plan);
  const limit = plan.monthlyAiLimit;
  if (plan.aiAnalysisUnlimited) {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "AiUsageMonth" ("id", "userId", "periodKey", "count", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${user.id}, ${periodKey}, 1, NOW(), NOW())
      ON CONFLICT ("userId", "periodKey")
      DO UPDATE SET "count" = "AiUsageMonth"."count" + 1, "updatedAt" = NOW()
      RETURNING "count"
    `;

    return { periodKey, count: rows[0].count, limit, unlimited: true };
  }

  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "AiUsageMonth" ("id", "userId", "periodKey", "count", "createdAt", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${user.id}, ${periodKey}, 1, NOW(), NOW())
    ON CONFLICT ("userId", "periodKey")
    DO UPDATE SET "count" = "AiUsageMonth"."count" + 1, "updatedAt" = NOW()
    WHERE "AiUsageMonth"."count" < ${limit}
    RETURNING "count"
  `;

  if (!rows.length) {
    const periodLabel = plan.aiLimitPeriod === "day" ? "本日の" : "今月の";
    const retryText =
      plan.aiLimitPeriod === "day"
        ? "明日以降に再度お試しください。"
        : "翌月まで待つか、プランを変更してください。";

    throw new UsageLimitError(
      `${periodLabel}AI分析上限（${limit}件）に達しています。${retryText}`,
      "ai_analysis",
    );
  }

  return { periodKey, count: rows[0].count, limit, unlimited: false };
}

export async function releaseAiAnalysis(userId: string, periodKey: string) {
  await prisma.aiUsageMonth.updateMany({
    where: { userId, periodKey, count: { gt: 0 } },
    data: { count: { decrement: 1 } },
  });
}

export class UsageLimitError extends Error {
  constructor(
    message: string,
    public readonly resource: "saved_items" | "ai_analysis",
    public readonly details?: {
      count?: number;
      limit?: number;
      planName?: string;
    },
  ) {
    super(message);
  }
}
