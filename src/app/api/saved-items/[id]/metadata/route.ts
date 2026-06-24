import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { fetchUrlMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { updateSavedItemPublishedAt } from "@/lib/saved-item-published-at";
import { ensureSystemCa } from "@/lib/system-ca";
import { getCurrentUser } from "@/lib/user";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(_: NextRequest, context: Context) {
  try {
    ensureSystemCa();
    const user = await getCurrentUser();
    const { id } = await context.params;
    const item = await prisma.savedItem.findFirst({
      where: { id, userId: user.id },
      select: { id: true, normalizedUrl: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "保存アイテムが見つかりません。" },
        { status: 404 },
      );
    }

    const metadata = await fetchUrlMetadata(item.normalizedUrl);
    const { publishedAt, ...storedMetadata } = metadata;
    // Avoid overwriting existing values with empty/undefined results from a failed fetch
    const dataToUpdate = Object.fromEntries(
      Object.entries(storedMetadata).filter(([, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null,
      ),
    );
    const updatedItem = await prisma.savedItem.update({
      where: { id: item.id },
      data: dataToUpdate,
    });
    await updateSavedItemPublishedAt(item.id, publishedAt);

    return NextResponse.json({
      item: { ...updatedItem, publishedAt: publishedAt ?? null },
    });
  } catch (error) {
    return apiError(error);
  }
}
