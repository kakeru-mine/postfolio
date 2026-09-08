"use client";

import type { Collection, SavedItem } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Calendar,
  CalendarDays,
  Check,
  ExternalLink,
  Globe2,
  ImageIcon,
  LoaderCircle,
  Trash2,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AiAnalysisPanel } from "@/components/ai-analysis-panel";
import { BulkItemActions } from "@/components/bulk-item-actions";
import { ItemEditor } from "@/components/item-editor";
import { MetadataRefreshButton } from "@/components/metadata-refresh-button";
import { platformLabel } from "@/lib/platform";
import type { AiRating } from "@/lib/saved-item-ai-rating";

export type CollectionSavedItem = SavedItem & {
  collection: Collection | null;
  aiRating: AiRating | null;
};

export function CollectionItemsBrowser({
  items,
  collections,
}: {
  items: CollectionSavedItem[];
  collections: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selecting = selectedIds.size > 0;
  const selectedItem = items.find((item) => item.id === selectedId);

  function toggleSelection(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function removeSelectedItem() {
    if (!selectedItem) return;
    setDeleting(true);
    setDeleteError("");
    const response = await fetch(`/api/saved-items/${selectedItem.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setDeleting(false);
      setDeleteError("削除できませんでした。");
      return;
    }

    setDeleteDialogOpen(false);
    setDeleting(false);
    setSelectedId(null);
    router.refresh();
  }

  if (!items.length) {
    return (
      <div className="card grid min-h-48 place-items-center p-8 text-center text-sm text-slate-500">
        このコレクションにはまだ投稿がありません。
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => {
          const selected = item.id === selectedId;
          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() =>
                  selecting
                    ? toggleSelection(item.id)
                    : setSelectedId(selected ? null : item.id)
                }
                className={`group block w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                  selectedIds.has(item.id)
                    ? "border-[var(--primary)] ring-4 ring-[var(--primary)]/20"
                    : selected
                      ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                      : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                }`}
                aria-pressed={selectedIds.has(item.id) || selected}
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-[#f4f0ea] to-[#e8dde9]">
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center p-2 text-center text-xs font-bold text-[var(--primary)] opacity-60">
                      <span>
                        <ImageIcon className="mx-auto mb-1" size={18} />
                        {platformLabel(item.sourcePlatform)}
                      </span>
                    </div>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleSelection(item.id)}
                className={`absolute top-2 left-2 z-10 grid size-7 place-items-center rounded-lg border shadow-sm backdrop-blur transition sm:size-8 ${
                  selectedIds.has(item.id)
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-white/80 bg-white/90 text-slate-400 hover:text-[var(--primary)]"
                }`}
                aria-label={
                  selectedIds.has(item.id) ? "選択を解除" : "投稿を選択"
                }
              >
                <Check size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <BulkItemActions
        selectedItems={items.filter((item) => selectedIds.has(item.id))}
        collections={collections}
        onComplete={() => {
          setSelectedIds(new Set());
          setSelectedId(null);
        }}
      />

      {selectedItem && !selecting ? (
        <div className="mt-5 space-y-5">
          <article className="card overflow-hidden">
            <div className="aspect-[16/7] overflow-hidden bg-gradient-to-br from-[#f4f0ea] to-[#e8dde9]">
              {selectedItem.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-3xl font-bold text-[var(--primary)] opacity-40">
                  {platformLabel(selectedItem.sourcePlatform)}
                </div>
              )}
            </div>
            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary-dark)]">
                  {platformLabel(selectedItem.sourcePlatform)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setDeleteDialogOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                    投稿を削除
                  </button>
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="button-secondary px-3 py-2 text-xs"
                  >
                    元の投稿
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold leading-8 sm:text-2xl">
                  {selectedItem.title ||
                    selectedItem.domain ||
                    selectedItem.url}
                </h3>
                {selectedItem.description ? (
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {selectedItem.description}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 flex justify-end">
                <MetadataRefreshButton
                  itemId={selectedItem.id}
                  className="button-secondary w-fit px-3.5 py-2.5 text-sm"
                />
              </div>
              {selectedItem.userTags.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedItem.userTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-5 text-sm sm:grid-cols-2">
                <DetailMeta
                  icon={<Globe2 size={16} />}
                  label="投稿SNS"
                  value={platformLabel(selectedItem.sourcePlatform)}
                />
                <DetailMeta
                  icon={<Calendar size={16} />}
                  label="登録日"
                  value={format(selectedItem.createdAt, "yyyy年M月d日", {
                    locale: ja,
                  })}
                />
                <DetailMeta
                  icon={<CalendarDays size={16} />}
                  label="投稿日"
                  value={
                    selectedItem.publishedAt
                      ? format(selectedItem.publishedAt, "yyyy年M月d日", {
                          locale: ja,
                        })
                      : "取得できませんでした"
                  }
                />
                <DetailMeta
                  icon={<UserRound size={16} />}
                  label="投稿者"
                  value={selectedItem.authorName ?? "投稿者情報なし"}
                />
              </dl>
            </div>
          </article>

          <ItemEditor
            key={`editor-${selectedItem.id}`}
            item={selectedItem}
            collections={collections}
            allowDelete={false}
            showOriginalPost={false}
          />

          <AiAnalysisPanel
            key={`analysis-${selectedItem.id}`}
            itemId={selectedItem.id}
            initialAnalysis={{
              summary: selectedItem.aiSummary,
              rating: selectedItem.aiRating,
              growthReason: selectedItem.aiGrowthReason,
              contentAngles: selectedItem.aiContentAngles,
              evaluationPoints: selectedItem.aiUseCases,
            }}
          />
        </div>
      ) : null}

      {deleteDialogOpen && selectedItem ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteDialogOpen(false);
            }
          }}
        >
          <div
            className="card w-full max-w-md p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-delete-title"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>
            <h3
              id="collection-delete-title"
              className="mt-4 text-center text-lg font-bold"
            >
              この投稿を削除しますか？
            </h3>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              削除した投稿は元に戻せません。
            </p>
            {deleteError ? (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={removeSelectedItem}
                disabled={deleting}
              >
                {deleting ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Trash2 size={17} />
                )}
                {deleting ? "削除中..." : "投稿を削除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailMeta({
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
        <dd className="mt-1 font-medium text-slate-600">{value}</dd>
      </div>
    </div>
  );
}
