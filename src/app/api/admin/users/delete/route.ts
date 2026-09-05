import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/admin";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanedImages } from "@/lib/saved-item-cleanup";
import { getCurrentUser } from "@/lib/user";

// Admin-only account deletion. Self-service deletion was removed to prevent
// accidental deletion; the operator deletes accounts here on request. Removing
// re-hosted images for every saved item can take a while.
export const maxDuration = 60;

const schema = z.object({ userId: z.string().min(1) });

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!isAdminEmail(admin.email)) {
      return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
    }

    const { userId } = schema.parse(await request.json());
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "自分自身のアカウントは削除できません。" },
        { status: 400 },
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: "対象のユーザーが見つかりません。" },
        { status: 404 },
      );
    }

    // Capture image URLs before the cascade delete removes the rows, then clean
    // up the re-hosted files from storage after the account is gone.
    const storedImages = await prisma.savedItem.findMany({
      where: { userId },
      select: { thumbnailUrl: true, mediaUrls: true },
    });
    await prisma.user.delete({ where: { id: userId } });
    await cleanupOrphanedImages(storedImages).catch((error) => {
      console.error("Admin account deletion image cleanup failed", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
