import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { apiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cleanupOrphanedImages } from "@/lib/saved-item-cleanup";
import { requireApiUser } from "@/lib/auth";
import { savedItemUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const item = await prisma.savedItem.findFirst({
      where: { id, userId: user.id },
      include: { collection: true },
    });

    if (!item) {
      return NextResponse.json({ error: "保存アイテムが見つかりません。" }, { status: 404 });
    }

    return NextResponse.json({ item });
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
      select: { id: true, collectionId: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "保存アイテムが見つかりません。" }, { status: 404 });
    }

    const item = await prisma.savedItem.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title || null } : {}),
        ...(input.memo !== undefined ? { userMemo: input.memo || null } : {}),
        ...(input.purpose !== undefined ? { purpose: input.purpose || null } : {}),
        ...(input.tags !== undefined ? { userTags: input.tags } : {}),
        ...(input.collectionId !== undefined
          ? { collectionId: input.collectionId || null }
          : {}),
      },
      include: { collection: true },
    });
    revalidatePath("/");
    revalidatePath(`/items/${id}`);
    revalidatePath("/collections");
    if (exists.collectionId) {
      revalidatePath(`/collections/${exists.collectionId}`);
    }
    if (item.collectionId) {
      revalidatePath(`/collections/${item.collectionId}`);
    }

    return NextResponse.json({ item });
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
      select: { collectionId: true, thumbnailUrl: true, mediaUrls: true },
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
    if (item?.collectionId) {
      revalidatePath(`/collections/${item.collectionId}`);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
