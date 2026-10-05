import { CollectionManager } from "@/components/collection-manager";
import { PageHeader } from "@/components/page-header";
import {
  flattenItemCollections,
  itemCollectionsSelect,
} from "@/lib/collections";
import { prisma } from "@/lib/prisma";
import { getSavedItemAiRatings } from "@/lib/saved-item-ai-rating";
import { requirePageUser } from "@/lib/user";

export default async function CollectionsPage() {
  const user = await requirePageUser();
  const [collections, items] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: user.id },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.savedItem.findMany({
      where: { userId: user.id, collections: { some: {} } },
      include: itemCollectionsSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  const ratings = await getSavedItemAiRatings(
    items.map((item) => item.id),
    user.id,
  );
  const itemsWithRatings = items.map((item) => ({
    ...item,
    collections: flattenItemCollections(item.collections),
    aiRating: ratings.get(item.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader
        eyebrow="Organize your sources"
        title="コレクション"
        description="保存したSNSの投稿を分類ごとに整理できます。"
      />
      <CollectionManager collections={collections} items={itemsWithRatings} />
    </div>
  );
}
