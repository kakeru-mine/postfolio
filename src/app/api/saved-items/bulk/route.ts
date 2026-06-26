import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanedImages } from "@/lib/saved-item-cleanup";
import { getCurrentUser } from "@/lib/user";

const itemIdsSchema = z.array(z.string().min(1)).min(1).max(100);

const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    itemIds: itemIdsSchema,
  }),
  z.object({
    action: z.literal("move"),
    itemIds: itemIdsSchema,
    collectionId: z.string().min(1).nullable(),
  }),
  z.object({
    action: z.literal("tag"),
    itemIds: itemIdsSchema,
    tags: z.array(z.string().trim().min(1).max(50)).min(1).max(20),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const input = bulkActionSchema.parse(await request.json());
    const itemIds = [...new Set(input.itemIds)];
    const items = await prisma.savedItem.findMany({
      where: { id: { in: itemIds }, userId: user.id },
      select: {
        id: true,
        collectionId: true,
        userTags: true,
        thumbnailUrl: true,
        mediaUrls: true,
      },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: "選択した投稿の一部が見つかりません。" },
        { status: 404 },
      );
    }

    if (input.action === "move" && input.collectionId) {
      const collection = await prisma.collection.findFirst({
        where: { id: input.collectionId, userId: user.id },
        select: { id: true },
      });
      if (!collection) {
        return NextResponse.json(
          { error: "移動先のコレクションが見つかりません。" },
          { status: 404 },
        );
      }
    }

    if (input.action === "delete") {
      await prisma.savedItem.deleteMany({
        where: { id: { in: itemIds }, userId: user.id },
      });
      await cleanupOrphanedImages(items);
    } else if (input.action === "move") {
      await prisma.savedItem.updateMany({
        where: { id: { in: itemIds }, userId: user.id },
        data: { collectionId: input.collectionId },
      });
    } else {
      await prisma.$transaction(
        items.map((item) =>
          prisma.savedItem.update({
            where: { id: item.id },
            data: {
              userTags: [...new Set([...item.userTags, ...input.tags])],
            },
          }),
        ),
      );
    }

    revalidatePath("/");
    revalidatePath("/collections");
    for (const collectionId of new Set(
      items.map((item) => item.collectionId).filter(Boolean),
    )) {
      revalidatePath(`/collections/${collectionId}`);
    }
    if (input.action === "move" && input.collectionId) {
      revalidatePath(`/collections/${input.collectionId}`);
    }

    return NextResponse.json({ updated: itemIds.length });
  } catch (error) {
    return apiError(error);
  }
}
