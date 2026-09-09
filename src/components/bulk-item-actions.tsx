"use client";

import {
  FolderInput,
  FolderMinus,
  LoaderCircle,
  Sparkles,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type SelectedItem = {
  id: string;
  userTags: string[];
};

type Dialog = "delete" | "move" | "tag" | "analyze" | "remove" | null;

export function BulkItemActions({
  selectedItems,
  collections,
  onComplete,
  allowRemoveFromCollection = false,
}: {
  selectedItems: SelectedItem[];
  collections: { id: string; name: string }[];
  onComplete: () => void;
  allowRemoveFromCollection?: boolean;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [tags, setTags] = useState("");
  const [progress, setProgress] = useState("");

  if (!selectedItems.length) return null;

  const itemIds = selectedItems.map((item) => item.id);

  async function runBulkAction() {
    if (!dialog || dialog === "analyze") return;
    setProcessing(true);
    setError("");

    try {
      const parsedTags =
        dialog === "tag"
          ? tags
              .split(/[,、\n]/)
              .map((tag) => tag.trim().replace(/^#/, ""))
              .filter(Boolean)
          : [];
      const body =
        dialog === "remove"
          ? { action: "move", itemIds, collectionId: null }
          : dialog === "move"
            ? {
                action: "move",
                itemIds,
                collectionId: collectionId || null,
              }
            : dialog === "tag"
              ? {
                  action: "tag",
                  itemIds,
                  tags: parsedTags,
                }
              : { action: "delete", itemIds };

      if (dialog === "tag" && parsedTags.length === 0) {
        setError("追加するタグを入力してください。");
        return;
      }

      const response = await fetch("/api/saved-items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "一括操作に失敗しました。");
        return;
      }

      finish();
    } catch {
      setError("一括操作に接続できませんでした。");
    } finally {
      setProcessing(false);
    }
  }

  async function analyzeAll() {
    setProcessing(true);
    setError("");

    try {
      for (let index = 0; index < itemIds.length; index += 1) {
        setProgress(`${index + 1} / ${itemIds.length} 件を分析中`);
        const response = await fetch("/api/ai/analyze-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: itemIds[index] }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(
            `${index + 1}件目: ${result.error ?? "AI分析に失敗しました。"}`,
          );
        }
      }

      finish();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "AI分析に失敗しました。",
      );
    } finally {
      setProcessing(false);
      setProgress("");
    }
  }

  function finish() {
    setDialog(null);
    setCollectionId("");
    setTags("");
    onComplete();
    router.refresh();
  }

  return (
    <>
      <div className="sticky bottom-4 z-30 mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-[var(--primary)]/20 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex sm:flex-wrap sm:items-center">
        <p className="col-span-2 flex items-center gap-2 px-2 text-sm font-bold text-[var(--ink)] sm:mr-auto sm:px-2">
          {selectedItems.length}件を選択中
          <span className="font-bold text-[var(--primary)]">まとめて選択</span>
        </p>
        <ActionButton icon={<Trash2 size={16} />} onClick={() => setDialog("delete")}>
          まとめて削除
        </ActionButton>
        <ActionButton icon={<FolderInput size={16} />} onClick={() => setDialog("move")}>
          まとめて移動
        </ActionButton>
        <ActionButton icon={<Tags size={16} />} onClick={() => setDialog("tag")}>
          <span className="sm:hidden">
            まとめて
            <br />
            タグ付け
          </span>
          <span className="hidden sm:inline">まとめてタグ付け</span>
        </ActionButton>
        <ActionButton icon={<Sparkles size={16} />} onClick={() => setDialog("analyze")}>
          まとめてAI分析
        </ActionButton>
        {allowRemoveFromCollection ? (
          <ActionButton
            icon={<FolderMinus size={16} />}
            onClick={() => setDialog("remove")}
          >
            コレクションから外す
          </ActionButton>
        ) : null}
        <button
          type="button"
          onClick={onComplete}
          className="absolute top-2 right-2 grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 sm:static"
          aria-label="選択を解除"
        >
          <X size={18} />
        </button>
      </div>

      {dialog ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processing) {
              setDialog(null);
              setError("");
            }
          }}
        >
          <div className="card w-full max-w-md p-6 shadow-2xl" role="dialog" aria-modal="true">
            <h3 className="text-center text-lg font-bold">
              {dialog === "delete"
                ? `${selectedItems.length}件の投稿を削除しますか？`
                : dialog === "move"
                  ? "移動先を選択"
                  : dialog === "tag"
                    ? "タグをまとめて追加"
                    : dialog === "remove"
                      ? "選択した投稿をコレクションから外しますか？"
                      : `${selectedItems.length}件をAI分析しますか？`}
            </h3>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              {dialog === "delete"
                ? "削除した投稿は元に戻せません。"
                : dialog === "move"
                  ? "選択した投稿のコレクションを一括変更します。"
                  : dialog === "tag"
                    ? "既存のタグは残したまま、新しいタグを追加します。"
                    : dialog === "remove"
                      ? "投稿は削除されず、未分類に戻ります。"
                      : (
                        <>
                          <span className="block">
                            選択した投稿ごとにAI分析を実行します。
                          </span>
                          <span className="block">
                            分析件数も投稿数分消費されます。
                          </span>
                        </>
                      )}
            </p>

            {dialog === "move" ? (
              <select
                className="input mt-5"
                value={collectionId}
                onChange={(event) => setCollectionId(event.target.value)}
                disabled={processing}
              >
                <option value="">未分類</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            ) : null}

            {dialog === "tag" ? (
              <input
                className="input mt-5 w-full rounded-xl border border-slate-900 bg-white px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="例：企画, デザイン"
                disabled={processing}
              />
            ) : null}

            {progress ? (
              <p className="mt-4 text-center text-sm font-bold text-[var(--primary)]">
                {progress}
              </p>
            ) : null}
            {error ? (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => {
                  setDialog(null);
                  setError("");
                }}
                disabled={processing}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={
                  dialog === "delete"
                    ? "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                    : "button-primary justify-center"
                }
                onClick={dialog === "analyze" ? analyzeAll : runBulkAction}
                disabled={processing}
              >
                {processing ? <LoaderCircle className="animate-spin" size={17} /> : null}
                {processing
                  ? "処理中..."
                  : dialog === "analyze"
                    ? "AI分析を実行"
                    : dialog === "remove"
                      ? "外す"
                      : "実行する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] sm:w-auto"
    >
      {icon}
      {children}
    </button>
  );
}
