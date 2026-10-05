"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import type { ItemCollection } from "@/lib/collections";

type ItemEditorProps = {
  item: {
    id: string;
    title: string | null;
    url: string;
    userMemo: string | null;
    userTags: string[];
    collections: Pick<ItemCollection, "id" | "name">[];
  };
  collections: { id: string; name: string }[];
  allowDelete?: boolean;
  showOriginalPost?: boolean;
};

export function ItemEditor({
  item,
  collections,
  allowDelete = true,
  showOriginalPost = true,
}: ItemEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // A post can be in many collections, so the picker is a multi-select.
  const [options, setOptions] = useState<{ id: string; name: string }[]>(
    collections,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(item.collections.map((collection) => collection.id)),
  );
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createCollection() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "コレクションを作成できませんでした。");
        return;
      }
      const created = result.collection as { id: string; name: string };
      setOptions((current) =>
        current.some((option) => option.id === created.id)
          ? current
          : [...current, { id: created.id, name: created.name }],
      );
      setSelectedIds((current) => new Set(current).add(created.id));
      setNewName("");
      setCreatingOpen(false);
    } catch {
      setError("コレクションを作成できませんでした。");
    } finally {
      setCreating(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    setError("");

    const response = await fetch(`/api/saved-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        memo: formData.get("memo"),
        collectionIds: [...selectedIds],
        tags: String(formData.get("tags") ?? "")
          .split(/[,\n、]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "更新できませんでした。");
      return;
    }

    setSelectedIds(
      new Set(
        (result.item.collections as ItemCollection[]).map(
          (collection) => collection.id,
        ),
      ),
    );
    setMessage("変更を保存しました。");
    router.refresh();
  }

  async function remove() {
    setDeleting(true);
    setError("");
    const response = await fetch(`/api/saved-items/${item.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setDeleting(false);
      setError("削除できませんでした。");
      setDeleteDialogOpen(false);
      return;
    }

    router.push("/items");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">リサーチメモ</h2>
        {showOriginalPost ? (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="button-secondary px-3 py-2 text-sm"
          >
            元の投稿
            <ExternalLink size={15} />
          </a>
        ) : null}
      </div>

      <div className="mt-6 space-y-5">
        <label className="block text-sm font-bold">
          タイトル
          <input
            className="field mt-2"
            name="title"
            defaultValue={item.title ?? ""}
          />
        </label>
        <label className="block text-sm font-bold">
          自分のメモ
          <textarea
            className="field mt-2 min-h-40 resize-y"
            name="memo"
            defaultValue={item.userMemo ?? ""}
            placeholder="参考になったポイントや次のアクション"
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="block text-sm font-bold">
            <div className="flex items-center justify-between gap-2">
              <span>コレクション</span>
              <button
                type="button"
                onClick={() => {
                  setCreatingOpen((open) => !open);
                  setError("");
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--accent-soft)]"
              >
                <Plus size={14} />
                新規追加
              </button>
            </div>
            {creatingOpen ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="field"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void createCollection();
                    }
                  }}
                  placeholder="コレクション名"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => void createCollection()}
                  disabled={creating || !newName.trim()}
                  className="button-primary shrink-0 px-3 py-2 text-sm disabled:opacity-60"
                >
                  {creating ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    "追加"
                  )}
                </button>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {options.length ? (
                options.map((collection) => {
                  const active = selectedIds.has(collection.id);
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => toggle(collection.id)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                        active
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:text-sky-700"
                      }`}
                    >
                      {active ? <Check size={13} /> : null}
                      {collection.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs font-medium text-slate-400">
                  コレクションがありません。「新規追加」で作成できます。
                </p>
              )}
            </div>
          </div>
          <label className="block text-sm font-bold">
            タグ
            <input
              className="field mt-2"
              name="tags"
              defaultValue={item.userTags.join(", ")}
              placeholder="カンマ区切り"
            />
          </label>
        </div>
      </div>

      {message ? (
        <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <div
        className={`mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5 ${
          allowDelete ? "justify-between" : "justify-end"
        }`}
      >
        {allowDelete ? (
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={16} />
            投稿を削除
          </button>
        ) : null}
        <button className="button-primary" disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
          {saving ? "保存中..." : "変更を保存"}
        </button>
      </div>

      {allowDelete && deleteDialogOpen ? (
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
            aria-labelledby="delete-item-title"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>
            <h3
              id="delete-item-title"
              className="mt-4 text-center text-lg font-bold"
            >
              この投稿を削除しますか？
            </h3>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              削除した投稿は元に戻せません。
            </p>
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
                onClick={remove}
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
    </form>
  );
}
