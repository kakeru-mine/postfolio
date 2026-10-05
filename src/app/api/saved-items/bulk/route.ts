import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanedImages } from "@/lib/saved-item-cleanup";
import { requireApiUser } from "@/lib/auth";

const itemIdsSchema = z.array(z.string().min(1)).min(1).max(100);

const bulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("delete"),
    itemIds: itemIdsSchema,
  }),
  // Add the selected posts to a collection (keeps their other memberships).
  z.object({
    action: z.literal("addToCollection"),
    itemIds: itemIdsSchema,
    collectionId: z.string().min(1),
  }),
  // Remove the selected posts from a single collection (the posts are kept).
  z.object({
    action: z.literal("removeFromCollection"),
    itemIds: itemIdsSchema,
    collectionId: z.string().min(1),
  }),
  z.object({
    action: z.literal("tag"),
    itemIds: itemIdsSchema,
    tags: z.array(z.string().trim().min(1).max(50)).min(1).max(20),
  }),
]);

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const input = bulkActionSchema.parse(await request.json());
    const itemIds = [...new Set(input.itemIds)];
    const items = await prisma.savedItem.findMany({
      where: { id: { in: itemIds }, userId: user.id },
      select: {
        id: true,
        userTags: true,
        thumbnailUrl: true,
        mediaUrls: true,
        collections: { select: { collectionId: true } },
      },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: "選択した投稿の一部が見つかりません。" },
        { status: 404 },
      );
    }

    if (
      input.action === "addToCollection" ||
      input.action === "removeFromCollection"
    ) {
      const collection = await prisma.collection.findFirst({
        where: { id: input.collectionId, userId: user.id },
        select: { id: true },
      });
      if (!collection) {
        return NextResponse.json(
          { error: "対象のコレクションが見つかりません。" },
          { status: 404 },
        );
      }
    }

    if (input.action === "delete") {
      await prisma.savedItem.deleteMany({
        where: { id: { in: itemIds }, userId: user.id },
      });
      await cleanupOrphanedImages(items);
    } else if (input.action === "addToCollection") {
      // Skip posts already in the collection so re-adding is a no-op.
      await prisma.collectionMembership.createMany({
        data: itemIds.map((savedItemId) => ({
          collectionId: input.collectionId,
          savedItemId,
        })),
        skipDuplicates: true,
      });
    } else if (input.action === "removeFromCollection") {
      await prisma.collectionMembership.deleteMany({
        where: {
          collectionId: input.collectionId,
          savedItemId: { in: itemIds },
        },
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
      items.flatMap((item) =>
        item.collections.map((membership) => membership.collectionId),
      ),
    )) {
      revalidatePath(`/collections/${collectionId}`);
    }
    if (
      input.action === "addToCollection" ||
      input.action === "removeFromCollection"
    ) {
      revalidatePath(`/collections/${input.collectionId}`);
    }

    return NextResponse.json({ updated: itemIds.length });
  } catch (error) {
    return apiError(error);
  }
}
