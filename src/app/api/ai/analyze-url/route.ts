import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  analyzeSavedItem,
  OpenAiConfigurationError,
  OpenAiRequestError,
} from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { platformLabel } from "@/lib/platform";
import { requireApiUser } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { updateSavedItemAiRating } from "@/lib/saved-item-ai-rating";
import {
  releaseAiAnalysis,
  reserveAiAnalysis,
  UsageLimitError,
} from "@/lib/usage";

// The OpenAI analysis can take well over the platform default; allow up to 60s
// so image-heavy posts don't 504 before analyzeSavedItem's own timeout.
export const maxDuration = 60;

const requestSchema = z.object({
  itemId: z.string().cuid(),
});

export async function POST(request: NextRequest) {
  let reservation:
    | { userId: string; periodKey: string }
    | undefined;

  try {
    const user = await requireApiUser(request);
    const { itemId } = requestSchema.parse(await request.json());
    const item = await prisma.savedItem.findFirst({
      where: { id: itemId, userId: user.id },
      include: { collections: { select: { collectionId: true } } },
    });

    if (!item) {
      return NextResponse.json(
        { error: "保存アイテムが見つかりません。" },
        { status: 404 },
      );
    }

    const usage = await reserveAiAnalysis(user);
    reservation = { userId: user.id, periodKey: usage.periodKey };

    const analysis = await analyzeSavedItem({
      url: item.url,
      platform: platformLabel(item.sourcePlatform),
      title: item.title,
      description: item.description,
      authorName: item.authorName,
      postText: item.postText,
      mediaUrls: item.mediaUrls,
      thumbnailUrl: item.thumbnailUrl,
    });

    const updatedItem = await prisma.savedItem.update({
      where: { id: item.id },
      data: {
        aiSummary: analysis.summary,
        aiTags: [],
        // aiUseCases now stores the rating-based evaluation points (good points
        // for B+ ratings, improvement points for C-), replacing reuse ideas.
        aiUseCases: analysis.evaluationPoints,
        aiGrowthReason: analysis.growthReason,
        aiContentAngles: analysis.contentAngles,
      },
    });
    await updateSavedItemAiRating(item.id, analysis.rating);
    // Latch a durable "has ever used AI analysis" flag for the onboarding
    // checklist, so it doesn't revert when the per-period usage count resets
    // (daily on Free, monthly on paid).
    await prisma.user.updateMany({
      where: { id: user.id, aiAnalysisUsedAt: null },
      data: { aiAnalysisUsedAt: new Date() },
    });
    revalidatePath(`/items/${item.id}`);
    revalidatePath("/collections");
    for (const { collectionId } of item.collections) {
      revalidatePath(`/collections/${collectionId}`);
    }

    return NextResponse.json({
      analysis: {
        summary: updatedItem.aiSummary,
        rating: analysis.rating,
        growthReason: updatedItem.aiGrowthReason,
        contentAngles: updatedItem.aiContentAngles,
        evaluationPoints: updatedItem.aiUseCases,
      },
      usage: {
        count: usage.count,
        limit: usage.limit,
      },
    });
  } catch (error) {
    if (reservation) {
      await releaseAiAnalysis(reservation.userId, reservation.periodKey);
    }
    if (error instanceof UsageLimitError) {
      return NextResponse.json(
        { error: error.message, resource: error.resource },
        { status: 403 },
      );
    }
    if (error instanceof OpenAiConfigurationError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof OpenAiRequestError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return apiError(error);
  }
}
