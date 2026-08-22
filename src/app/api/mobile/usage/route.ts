import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { getUsageSummary } from "@/lib/usage";

// Usage meters for the mobile home screen: saved-item slot and AI-analysis
// counts against the current plan's limits. Mirrors the web dashboard's
// 利用状況 card so the app can render the same two progress bars.
export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const usage = await getUsageSummary(user);

    return NextResponse.json({
      plan: {
        name: usage.plan.name,
        savedItemLimit: usage.plan.savedItemLimit,
        monthlyAiLimit: usage.plan.monthlyAiLimit,
        aiLimitPeriod: usage.plan.aiLimitPeriod,
        aiAnalysisUnlimited: usage.plan.aiAnalysisUnlimited,
      },
      savedItemCount: usage.savedItemCount,
      aiAnalysisCount: usage.aiAnalysisCount,
    });
  } catch (error) {
    return apiError(error);
  }
}
