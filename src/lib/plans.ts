import { SubscriptionPlan } from "@prisma/client";

export const planDefinitions = {
  FREE: {
    plan: SubscriptionPlan.FREE,
    name: "Free",
    priceYen: 0,
    savedItemLimit: 30,
    monthlyAiLimit: 1,
    aiLimitPeriod: "day",
    aiAnalysisUnlimited: false,
    description: "まずは個人のSNSリサーチを始めたい方へ",
  },
  PRO: {
    plan: SubscriptionPlan.PRO,
    name: "Pro",
    priceYen: 500,
    savedItemLimit: 200,
    monthlyAiLimit: 100,
    aiLimitPeriod: "month",
    aiAnalysisUnlimited: false,
    description: "日常的に企画や発信へ活用する方へ",
  },
  CREATOR: {
    plan: SubscriptionPlan.CREATOR,
    name: "Creator",
    priceYen: 980,
    savedItemLimit: 500,
    monthlyAiLimit: 200,
    aiLimitPeriod: "month",
    aiAnalysisUnlimited: false,
    description: "多くの投稿を蓄積・分析するクリエイターへ",
  },
} as const;

export type PlanDefinition = (typeof planDefinitions)[keyof typeof planDefinitions];

export function aiLimitLabel(plan: PlanDefinition) {
  if (plan.aiAnalysisUnlimited) return "AI分析 無制限（機能確認中）";
  return plan.aiLimitPeriod === "day"
    ? `AI分析 1日${plan.monthlyAiLimit}件`
    : `AI分析 月${plan.monthlyAiLimit}件`;
}

export function getPlanDefinition(plan: SubscriptionPlan) {
  return planDefinitions[plan];
}

export function planFromPriceId(priceId: string | null | undefined) {
  if (priceId && priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return SubscriptionPlan.PRO;
  }
  if (priceId && priceId === process.env.STRIPE_CREATOR_PRICE_ID) {
    return SubscriptionPlan.CREATOR;
  }
  return SubscriptionPlan.FREE;
}

export function priceIdForPlan(plan: SubscriptionPlan) {
  if (plan === SubscriptionPlan.PRO) return process.env.STRIPE_PRO_PRICE_ID;
  if (plan === SubscriptionPlan.CREATOR)
    return process.env.STRIPE_CREATOR_PRICE_ID;
  return undefined;
}
