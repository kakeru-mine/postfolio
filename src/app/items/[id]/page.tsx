import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowLeft, Calendar, CalendarDays, Globe2, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiAnalysisPanel } from "@/components/ai-analysis-panel";
import { ItemEditor } from "@/components/item-editor";
import { MetadataRefreshButton } from "@/components/metadata-refresh-button";
import { ThumbnailImage } from "@/components/thumbnail-image";
import { platformLabel } from "@/lib/platform";
import { prisma } from "@/lib/prisma";
import { getSavedItemAiRating } from "@/lib/saved-item-ai-rating";
import { getSavedItemPublishedAt } from "@/lib/saved-item-published-at";
import { requirePageUser } from "@/lib/user";

export default async function ItemDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;
  const [item, collections, publishedAt, aiRating] = await Promise.all([
    prisma.savedItem.findFirst({
      where: { id, userId: user.id },
      include: { collection: true },
    }),
    prisma.collection.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getSavedItemPublishedAt(id, user.id),
    getSavedItemAiRating(id, user.id),
  ]);

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <Link
        href="/items"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--primary)]"
      >
        <ArrowLeft size={17} />
        保存一覧へ
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
        <section className="space-y-6">
          <div className="card overflow-hidden">
            <div className="aspect-[16/7] bg-gradient-to-br from-[#f4f0ea] to-[#e8dde9]">
              {item.thumbnailUrl ? (
                <ThumbnailImage
                  src={item.thumbnailUrl}
                  className="h-full w-full object-cover"
                  fallback={
                    <div className="grid h-full place-items-center text-5xl font-bold text-[var(--primary)] opacity-25">
                      {platformLabel(item.sourcePlatform)}
                    </div>
                  }
                />
              ) : (
                <div className="grid h-full place-items-center text-5xl font-bold text-[var(--primary)] opacity-25">
                  {platformLabel(item.sourcePlatform)}
                </div>
              )}
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--primary-dark)]">
                    {platformLabel(item.sourcePlatform)}
                  </span>
                  {item.userTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <h1 className="text-2xl font-bold leading-9 sm:text-3xl">
                  {item.title || item.domain || item.url}
                </h1>
                {item.description ? (
                  <p className="mt-4 leading-7 text-slate-600">
                    {truncateText(item.description, 50)}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex justify-end">
                <MetadataRefreshButton
                  itemId={item.id}
                  className="button-secondary w-fit px-3.5 py-2.5 text-sm"
                />
              </div>

              <dl className="mt-7 grid gap-4 border-t border-slate-100 pt-6 text-sm sm:grid-cols-2">
                <Meta
                  label="投稿SNS"
                  icon={<Globe2 size={17} />}
                  value={platformLabel(item.sourcePlatform)}
                />
                <Meta
                  label="登録日"
                  icon={<Calendar size={16} />}
                  value={format(item.createdAt, "yyyy年M月d日", {
                    locale: ja,
                  })}
                />
                <Meta
                  label="投稿日"
                  icon={<CalendarDays size={17} />}
                  value={
                    publishedAt
                      ? format(publishedAt, "yyyy年M月d日", { locale: ja })
                      : "取得できませんでした"
                  }
                />
                <Meta
                  label="投稿者"
                  icon={<UserRound size={16} />}
                  value={item.authorName ?? "投稿者情報なし"}
                />
              </dl>
            </div>
          </div>

          <div className="lg:hidden">
            <ItemEditor item={item} collections={collections} />
          </div>

          <AiAnalysisPanel
            itemId={item.id}
            initialAnalysis={{
              summary: item.aiSummary,
              rating: aiRating,
              growthReason: item.aiGrowthReason,
              contentAngles: item.aiContentAngles,
              evaluationPoints: item.aiUseCases,
            }}
          />
        </section>

        <aside className="hidden lg:block">
          <ItemEditor item={item} collections={collections} />
        </aside>
      </div>
    </div>
  );
}

function truncateText(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs font-bold text-slate-400">{label}</dt>
        <dd className="mt-1 truncate font-medium text-slate-600">{value}</dd>
      </div>
    </div>
  );
}
