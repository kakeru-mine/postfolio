import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddItemsToCollection } from "@/components/add-items-to-collection";
import { CollectionItemsBrowser } from "@/components/collection-items-browser";
import { prisma } from "@/lib/prisma";
import { getSavedItemAiRatings } from "@/lib/saved-item-ai-rating";
import { requirePageUser } from "@/lib/user";

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;
  const [collection, collectionOptions] = await Promise.all([
    prisma.collection.findFirst({
      where: { id, userId: user.id },
      include: {
        items: {
          include: { collection: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        },
      },
    }),
    prisma.collection.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!collection) notFound();
  const ratings = await getSavedItemAiRatings(
    collection.items.map((item) => item.id),
    user.id,
  );
  const items = collection.items.map((item) => ({
    ...item,
    aiRating: ratings.get(item.id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
      <Link
        href="/collections"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--primary)]"
      >
        <ArrowLeft size={17} />
        コレクション一覧へ
      </Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 size-4 shrink-0 rounded-full"
            style={{ backgroundColor: collection.color }}
          />
          <div>
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {collection.description || "登録された投稿を確認できます。"}
            </p>
            <p className="mt-2 text-xs font-bold text-slate-400">
              {collection.items.length}件
            </p>
          </div>
        </div>
        <AddItemsToCollection
          collectionId={collection.id}
          collectionName={collection.name}
        />
      </div>
      <div className="mt-7">
        <CollectionItemsBrowser
          items={items}
          collections={collectionOptions}
        />
      </div>
    </div>
  );
}
