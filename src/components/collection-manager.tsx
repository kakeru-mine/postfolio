"use client";

import type { Collection, SavedItem } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  ImageIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { CollectionItemsBrowser } from "@/components/collection-items-browser";
import { ManualHelpButton } from "@/components/manual-help-button";
import type { AiRating } from "@/lib/saved-item-ai-rating";

type CollectionItem = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  _count: { items: number };
};

type SavedItemWithCollection = SavedItem & {
  collection: Collection | null;
  aiRating: AiRating | null;
};

export function CollectionManager({
  collections,
  items,
}: {
  collections: CollectionItem[];
  items: SavedItemWithCollection[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CollectionItem | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CollectionItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(collections[0]?.id ?? null);
  const selectedCollection = collections.find(
    (collection) => collection.id === selectedCollectionId,
  );
  const selectedItems = selectedCollectionId
    ? items.filter((item) => item.collectionId === selectedCollectionId)
    : [];

  function showCreate() {
    setEditing(null);
    setError("");
    setOpen(true);
  }

  function showEdit(collection: CollectionItem) {
    setEditing(collection);
    setError("");
    setOpen(true);
  }

  async function submit(formData: FormData) {
    setSaving(true);
    setError("");
    const response = await fetch(
      editing ? `/api/collections/${editing.id}` : "/api/collections",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
          color: formData.get("color"),
        }),
      },
    );
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "保存できませんでした。");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  function requestRemove(collection: CollectionItem) {
    setDeleteError("");
    setDeleteTarget(collection);
  }

  async function confirmRemove() {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError("");
    const response = await fetch(`/api/collections/${deleteTarget.id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!response.ok) {
      setDeleteError("削除できませんでした。");
      return;
    }
    if (selectedCollectionId === deleteTarget.id) {
      setSelectedCollectionId(
        collections.find((collection) => collection.id !== deleteTarget.id)
          ?.id ?? null,
      );
    }
    setDeleteTarget(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={showCreate} className="button-primary">
          <Plus size={18} />
          新規コレクション
        </button>
        <ManualHelpButton topics={["collection"]} />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:hidden">
        {collections.map((collection) => {
          const collectionItems = items.filter(
            (item) => item.collectionId === collection.id,
          );
          return (
            <article key={collection.id} className="card overflow-hidden">
              <Link
                href={`/collections/${collection.id}`}
                className="block min-h-44 p-3"
              >
                <div
                  className="grid size-9 place-items-center rounded-xl text-white"
                  style={{ backgroundColor: collection.color }}
                >
                  <FolderOpen size={18} />
                </div>
                <h2 className="mt-3 line-clamp-2 text-sm font-bold">
                  {collection.name}
                </h2>
                <p className="mt-2 text-xs font-bold text-slate-400">
                  {collection._count.items}件
                </p>
                {collectionItems.length ? (
                  <div className="mt-3 grid grid-cols-3 gap-1">
                    {collectionItems.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="aspect-square overflow-hidden rounded-md bg-gradient-to-br from-[#f4f0ea] to-[#e8dde9]"
                      >
                        {item.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center text-slate-300">
                            <ImageIcon size={13} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 grid h-10 place-items-center rounded-lg bg-slate-50 text-slate-300">
                    <ImageIcon size={15} />
                  </div>
                )}
              </Link>
              <div className="flex justify-end gap-1 border-t border-slate-100 px-2 py-1">
                <CollectionActions
                  collection={collection}
                  onEdit={showEdit}
                  onRemove={requestRemove}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 hidden items-start gap-7 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          {collections.map((collection) => {
            const selected = selectedCollectionId === collection.id;
            return (
              <article
                key={collection.id}
                className={`card overflow-hidden transition ${
                  selected
                    ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15"
                    : "hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-3 p-4 text-left"
                  onClick={() => setSelectedCollectionId(collection.id)}
                  aria-pressed={selected}
                >
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: collection.color }}
                  >
                    <FolderOpen size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {collection.name}
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {collection._count.items}件
                    </span>
                  </span>
                </button>
                <div className="flex justify-end gap-1 border-t border-slate-100 px-3 py-1">
                  <CollectionActions
                    collection={collection}
                    onEdit={showEdit}
                    onRemove={requestRemove}
                  />
                </div>
              </article>
            );
          })}
        </div>

        <section className="min-w-0">
          {selectedCollection ? (
            <>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-[var(--primary)] uppercase">
                    Collection items
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    {selectedCollection.name}
                  </h2>
                </div>
                <p className="text-sm font-bold text-slate-400">
                  {selectedItems.length}件
                </p>
              </div>
              <CollectionItemsBrowser
                items={selectedItems}
                collections={collections.map(({ id, name }) => ({ id, name }))}
              />
            </>
          ) : (
            <div className="card grid min-h-72 place-items-center p-8 text-center text-sm text-slate-500">
              左側のコレクションを選択すると、登録投稿が表示されます。
            </div>
          )}
        </section>
      </div>

      {!collections.length ? (
        <div className="card mt-8 p-10 text-center text-sm text-slate-500">
          コレクションを作ると、保存した投稿を目的別に整理できます。
        </div>
      ) : null}

      {open ? (
        <div className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm">
          <form action={submit} className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editing ? "コレクションを編集" : "コレクションを作成"}
              </h2>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-bold">
                名前
                <input
                  className="field mt-2"
                  name="name"
                  defaultValue={editing?.name ?? ""}
                  required
                  autoFocus
                />
              </label>
              <label className="block text-sm font-bold">
                説明
                <textarea
                  className="field mt-2 min-h-24"
                  name="description"
                  defaultValue={editing?.description ?? ""}
                />
              </label>
              <label className="block text-sm font-bold">
                カラー
                <input
                  className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-slate-200 p-1"
                  name="color"
                  type="color"
                  defaultValue={editing?.color ?? "#6C63FF"}
                />
              </label>
            </div>
            {error ? (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="button-secondary"
                onClick={() => setOpen(false)}
              >
                キャンセル
              </button>
              <button className="button-primary" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" size={17} /> : null}
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="theme-overlay fixed inset-0 z-[80] grid place-items-center p-4 backdrop-blur-sm">
          <div
            className="card w-full max-w-md p-6 text-center shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-delete-title"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>
            <h2 id="collection-delete-title" className="mt-4 text-xl font-bold">
              コレクションを削除しますか？
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              「{deleteTarget.name}」を削除します。コレクション内の投稿は削除されず、未分類に移動します。
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
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-60"
                onClick={() => void confirmRemove()}
                disabled={deleting}
              >
                {deleting ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Trash2 size={17} />
                )}
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CollectionActions({
  collection,
  onEdit,
  onRemove,
}: {
  collection: CollectionItem;
  onEdit: (collection: CollectionItem) => void;
  onRemove: (collection: CollectionItem) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onEdit(collection)}
        className="rounded-lg p-2 text-slate-400 hover:bg-[var(--accent-soft)] hover:text-[var(--primary-dark)]"
        aria-label={`${collection.name}を編集`}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={() => onRemove(collection)}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
        aria-label={`${collection.name}を削除`}
      >
        <Trash2 size={15} />
      </button>
    </>
  );
}
