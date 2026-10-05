import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanedImages } from "@/lib/saved-item-cleanup";
import { requireApiUser } from "@/lib/auth";
import { flattenItemCollections, itemCollectionsSelect } from "@/lib/collections";
import { savedItemUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const item = await prisma.savedItem.findFirst({
      where: { id, userId: user.id },
      include: itemCollectionsSelect,
    });

    if (!item) {
      return NextResponse.json({ error: "保存アイテムが見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({
      item: { ...item, collections: flattenItemCollections(item.collections) },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const input = savedItemUpdateSchema.parse(await request.json());

    const exists = await prisma.savedItem.findFirst({
      where: { id, userId: user.id },
      select: { id: true, collections: { select: { collectionId: true } } },
    });
    if (!exists) {
      return NextResponse.json({ error: "保存アイテムが見つかりません。" }, { status: 404 });
    }
    const previousCollectionIds = exists.collections.map((c) => c.collectionId);

    // Collection memberships are replaced wholesale when the caller sends a
    // desired set. `collectionIds` is the canonical field; `collectionId` is
    // accepted as a single-element set for older callers.
    const desiredCollectionIds =
      input.collectionIds !== undefined
        ? input.collectionIds
        : input.collectionId !== undefined
          ? input.collectionId
            ? [input.collectionId]
            : []
          : undefined;

    let membershipUpdate = {};
    if (desiredCollectionIds !== undefined) {
      const unique = [...new Set(desiredCollectionIds)];
      const owned = unique.length
        ? (
            await prisma.collection.findMany({
              where: { id: { in: unique }, userId: user.id },
              select: { id: true },
            })
          ).map((collection) => collection.id)
        : [];
      membershipUpdate = {
        collections: {
          deleteMany: {},
          create: owned.map((collectionId) => ({ collectionId })),
        },
      };
    }

    const item = await prisma.savedItem.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title || null } : {}),
        ...(input.memo !== undefined ? { userMemo: input.memo || null } : {}),
        ...(input.purpose !== undefined ? { purpose: input.purpose || null } : {}),
        ...(input.tags !== undefined ? { userTags: input.tags } : {}),
        ...membershipUpdate,
      },
      include: itemCollectionsSelect,
    });
    revalidatePath("/");
    revalidatePath(`/items/${id}`);
    revalidatePath("/collections");
    const flattened = flattenItemCollections(item.collections);
    for (const collectionId of new Set([
      ...previousCollectionIds,
      ...flattened.map((collection) => collection.id),
    ])) {
      revalidatePath(`/collections/${collectionId}`);
    }

    return NextResponse.json({ item: { ...item, collections: flattened } });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const item = await prisma.savedItem.findFirst({
      where: { id, userId: user.id },
      select: {
        thumbnailUrl: true,
        mediaUrls: true,
        collections: { select: { collectionId: true } },
      },
    });
    const result = await prisma.savedItem.deleteMany({
      where: { id, userId: user.id },
    });

    if (!result.count) {
      return NextResponse.json({ error: "保存アイテムが見つかりません。" }, { status: 404 });
    }

    if (item) await cleanupOrphanedImages([item]);

    revalidatePath("/");
    revalidatePath("/collections");
    for (const { collectionId } of item?.collections ?? []) {
      revalidatePath(`/collections/${collectionId}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
