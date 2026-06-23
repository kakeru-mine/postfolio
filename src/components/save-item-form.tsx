"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Link2, LoaderCircle, Plus } from "lucide-react";

type CollectionOption = { id: string; name: string };

export function SaveItemForm({
  collections,
}: {
  collections: CollectionOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [limitError, setLimitError] = useState<{
    message: string;
    count?: number;
    limit?: number;
    planName?: string;
  } | null>(null);

  async function submit(formData: FormData) {
    setSaving(true);
    setError("");
    setLimitError(null);

    const response = await fetch("/api/saved-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: formData.get("url"),
        memo: formData.get("memo"),
        collectionId: formData.get("collectionId") || null,
        tags: String(formData.get("tags") ?? "")
          .split(/[,\n、]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });

    const result = (await response.json()) as {
      item?: { id: string };
      error?: string;
      resource?: string;
      details?: { count?: number; limit?: number; planName?: string };
    };
    setSaving(false);
    if (!response.ok) {
      if (result.resource === "saved_items") {
        setLimitError({
          message: result.error ?? "保存枠の上限に達しています。",
          ...result.details,
        });
        return;
      }
      setError(result.error ?? "保存できませんでした。");
      return;
    }

    setOpen(false);
    if (result.item) router.push(`/items/${result.item.id}`);
    router.refresh();
  }

  if (!open) {
    return (
      <button className="button-primary" onClick={() => setOpen(true)}>
        <Plus size={18} />
        新規作成
      </button>
    );
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="theme-overlay fixed inset-0 z-[120] grid place-items-center p-4 backdrop-blur-sm">
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary-dark)]">
              <Link2 size={20} />
            </div>
            <h2 className="text-xl font-bold">新しいURLを保存</h2>
            <p className="mt-1 text-sm text-slate-500">
              ページ情報は保存時に自動で取得します。
            </p>
          </div>
          <button
            className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100"
            onClick={() => setOpen(false)}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <form action={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">
            URL <span className="text-rose-500">*</span>
            <input
              className="field mt-2"
              name="url"
              type="url"
              placeholder="対応SNSのURLを入力"
              required
              autoFocus
            />
          </label>
          <label className="block text-sm font-bold">
            メモ
            <textarea
              className="field mt-2 min-h-24 resize-y"
              name="memo"
              placeholder="なぜ保存したか、どこが参考になったか"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              コレクション
              <select className="field mt-2" name="collectionId">
                <option value="">未分類</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold">
              タグ
              <input
                className="field mt-2"
                name="tags"
                placeholder="カンマ区切りで複数入力"
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          ) : null}

          {limitError ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <p className="font-bold">保存枠の上限に達しています</p>
                  <p className="mt-1">{limitError.message}</p>
                  {limitError.limit ? (
                    <p className="mt-1 text-xs">
                      現在: {limitError.count ?? limitError.limit} /{" "}
                      {limitError.limit}件
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/pricing" className="button-primary px-3 py-2 text-xs">
                      プランを確認
                    </Link>
                    <button
                      type="button"
                      className="button-secondary px-3 py-2 text-xs"
                      onClick={() => setOpen(false)}
                    >
                      投稿を整理する
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setOpen(false)}
            >
              キャンセル
            </button>
            <button className="button-primary min-w-28" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" size={18} /> : null}
              {saving ? "取得中..." : "保存する"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
