import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/http";
import { persistMetadataMedia } from "@/lib/image-storage";
import { fetchUrlMetadata } from "@/lib/metadata";
import { prisma } from "@/lib/prisma";
import { updateSavedItemPublishedAt } from "@/lib/saved-item-published-at";
import { ensureSystemCa } from "@/lib/system-ca";
import { requireApiUser } from "@/lib/auth";
import { flattenItemCollections, itemCollectionsSelect } from "@/lib/collections";

// Re-fetching metadata downloads and re-hosts CDN images, which can exceed the
// platform's default function timeout.
export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  try {
    ensureSystemCa();
    const user = await requireApiUser(request);
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

    const metadata = await persistMetadataMedia(
      await fetchUrlMetadata(item.normalizedUrl),
    );
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
      include: itemCollectionsSelect,
    });
    await updateSavedItemPublishedAt(item.id, publishedAt);

    return NextResponse.json({
      item: {
        ...updatedItem,
        collections: flattenItemCollections(updatedItem.collections),
        publishedAt: publishedAt ?? null,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
