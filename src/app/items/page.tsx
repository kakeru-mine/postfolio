import { Inbox } from "lucide-react";
import { ItemFilters } from "@/components/item-filters";
import { ManualHelpButton } from "@/components/manual-help-button";
import { SaveItemForm } from "@/components/save-item-form";
import { SortableItemGrid } from "@/components/sortable-item-grid";
import { prisma } from "@/lib/prisma";
import { parseSupportedPlatform } from "@/lib/platform";
import { requirePageUser } from "@/lib/user";

type SearchParams = Promise<{
  q?: string;
  platform?: string;
  collectionId?: string;
  tag?: string;
}>;

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePageUser();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const platform = parseSupportedPlatform(params.platform);
  const collectionId = params.collectionId ?? "";
  const tag = params.tag?.trim() ?? "";

  const [collections, tagSources, items] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.savedItem.findMany({
      where: { userId: user.id },
      select: { userTags: true },
    }),
    prisma.savedItem.findMany({
      where: {
        userId: user.id,
        ...(platform ? { sourcePlatform: platform } : {}),
        ...(collectionId ? { collectionId } : {}),
        ...(tag ? { userTags: { has: tag } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
                { userMemo: { contains: q, mode: "insensitive" as const } },
                { purpose: { contains: q, mode: "insensitive" as const } },
                { url: { contains: q, mode: "insensitive" as const } },
                { userTags: { has: q } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        url: true,
        sourcePlatform: true,
        title: true,
        authorName: true,
        description: true,
        thumbnailUrl: true,
        domain: true,
        userMemo: true,
        purpose: true,
        userTags: true,
        createdAt: true,
        collection: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  const tags = [...new Set(tagSources.flatMap((item) => item.userTags))].sort(
    (a, b) => a.localeCompare(b, "ja"),
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <section className="rounded-[2rem] border border-[var(--line)] bg-[var(--canvas)]/90 p-5 shadow-[0_22px_70px_rgba(17,24,39,0.09)] backdrop-blur sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black tracking-[0.22em] text-[var(--primary)] uppercase">
              Your research library
            </p>
            <h1 className="text-3xl font-black tracking-tight text-[var(--ink)] sm:text-4xl">
              保存アイテム
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              保存したSNS投稿を、あとで探しやすいリサーチカードとして整理します。
            </p>
          </div>
          <div className="hidden flex-wrap items-center gap-3 sm:flex">
            <SaveItemForm collections={collections} />
            <ManualHelpButton topics={["register", "organize"]} />
          </div>
        </div>

        <div className="mt-5">
          <ItemFilters
            q={q}
            platform={platform ?? ""}
            collectionId={collectionId}
            tag={tag}
            collections={collections}
            tags={tags}
          />
        </div>
      </section>
      <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
        <SaveItemForm collections={collections} />
        <ManualHelpButton topics={["register", "organize"]} />
      </div>

      {items.length ? (
        <>
          <div className="mt-5 flex items-center justify-between sm:mt-7">
            <p className="text-sm font-black tracking-wide text-[var(--muted)]">
              {items.length}件
            </p>
          </div>
          <SortableItemGrid items={items} collections={collections} />
        </>
      ) : (
        <div className="card mt-7 grid min-h-80 place-items-center p-8 text-center">
          <div>
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary-dark)]">
              <Inbox size={26} />
            </div>
            <h2 className="mt-4 text-lg font-bold">
              {q || platform || collectionId || tag
                ? "条件に合うアイテムがありません"
                : "最初のURLを保存しましょう"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              気になった投稿を、忘れる前にリサーチ資産へ。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
