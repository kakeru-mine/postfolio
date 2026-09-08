"use client";

import type { SourcePlatform } from "@prisma/client";
import { Check, FolderPlus, ImageIcon, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { platformLabel } from "@/lib/platform";

type PickItem = {
  id: string;
  title: string | null;
  url: string;
  domain: string | null;
  thumbnailUrl: string | null;
  sourcePlatform: SourcePlatform;
  collectionId: string | null;
};

// Lets the user add already-saved posts to a collection from the collection page.
// A saved item belongs to a single collection, so adding is a bulk "move" into
// this collection; items already in it are hidden from the picker.
export function AddItemsToCollection({
  collectionId,
  collectionName,
}: {
  collectionId: string;
  collectionName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PickItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function openPicker() {
    setOpen(true);
    setLoading(true);
    setError("");
    setSelected(new Set());
    try {
      const response = await fetch("/api/saved-items");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "取得に失敗しました。");
      }
      setItems(
        (data.items as PickItem[]).filter(
          (item) => item.collectionId !== collectionId,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function add() {
    if (selected.size === 0) return;
    setAdding(true);
    setError("");
    try {
      const response = await fetch("/api/saved-items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "move",
          itemIds: [...selected],
          collectionId,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "追加に失敗しました。");
      }
      setOpen(false);
      setSelected(new Set());
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "追加に失敗しました。");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-[var(--accent-soft)] px-4 py-2.5 text-sm font-bold text-[var(--primary)] transition hover:bg-[var(--primary)] hover:text-white"
      >
        <FolderPlus size={16} />
        投稿を追加
      </button>

      {open ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !adding) {
              setOpen(false);
            }
          }}
        >
          <div
            className="card flex max-h-[85vh] w-full max-w-3xl flex-col p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">コレクションに追加</h3>
                <p className="mt-1 text-sm text-slate-500">{collectionName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="閉じる"
                disabled={adding}
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              追加する保存済みの投稿を選んでください。
            </p>

            <div className="mt-4 min-h-40 flex-1 overflow-y-auto">
              {loading ? (
                <div className="grid min-h-40 place-items-center text-slate-400">
                  <LoaderCircle className="animate-spin" size={24} />
                </div>
              ) : items.length === 0 ? (
                <div className="grid min-h-40 place-items-center text-center text-sm text-slate-500">
                  追加できる投稿がありません。
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {items.map((item) => {
                    const isSelected = selected.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggle(item.id)}
                        className={`relative block overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                          isSelected
                            ? "border-[var(--primary)] ring-4 ring-[var(--primary)]/20"
                            : "border-slate-200 hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                        aria-pressed={isSelected}
                      >
                        <div className="aspect-square overflow-hidden bg-gradient-to-br from-[#f4f0ea] to-[#e8dde9]">
                          {item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnailUrl}
                              alt=""
                              className="h-full w-full object-cover"
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
                        <span
                          className={`absolute top-2 left-2 grid size-7 place-items-center rounded-lg border shadow-sm transition ${
                            isSelected
                              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                              : "border-white/80 bg-white/90 text-transparent"
                          }`}
                        >
                          <Check size={16} />
                        </span>
                        <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-slate-600">
                          {item.title || item.domain || item.url}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error ? (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-3">
              <span className="text-sm font-bold text-slate-500">
                {selected.size}件選択中
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="button-secondary justify-center"
                  onClick={() => setOpen(false)}
                  disabled={adding}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  className="button-primary justify-center disabled:opacity-60"
                  onClick={add}
                  disabled={adding || selected.size === 0}
                >
                  {adding ? (
                    <LoaderCircle className="animate-spin" size={17} />
                  ) : null}
                  {adding ? "追加中..." : "選択した投稿を追加"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
