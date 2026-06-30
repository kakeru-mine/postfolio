"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  publishedAt: string | Date;
};

function formatDate(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function AnnouncementAdmin({
  initialAnnouncements,
}: {
  initialAnnouncements: AdminAnnouncement[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setPublished(true);
    setError("");
  }

  function startEdit(announcement: AdminAnnouncement) {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setBody(announcement.body);
    setPublished(announcement.published);
    setError("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit() {
    if (!title.trim() || !body.trim()) {
      setError("タイトルと本文を入力してください。");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        editingId
          ? `/api/admin/announcements/${editingId}`
          : "/api/admin/announcements",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body, published }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "保存できませんでした。");
      resetForm();
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "保存できませんでした。",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("このお知らせを削除しますか？")) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      if (editingId === id) resetForm();
      router.refresh();
    } catch {
      setError("削除できませんでした。");
    }
  }

  return (
    <div className="space-y-8">
      <section className="card p-6 sm:p-8">
        <h2 className="font-bold">
          {editingId ? "お知らせを編集" : "新しいお知らせを投稿"}
        </h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-bold">タイトル</span>
            <input
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              className="field mt-2"
              placeholder="例：機能アップデートのお知らせ"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold">本文</span>
            <textarea
              value={body}
              maxLength={4000}
              onChange={(event) => setBody(event.target.value)}
              className="field mt-2 min-h-32"
              placeholder="お知らせの本文を入力してください。"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="size-4"
            />
            公開する（オフにすると下書きとして保存）
          </label>

          {error ? (
            <p className="text-sm font-bold text-red-600">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="button-primary"
              onClick={submit}
              disabled={saving}
            >
              <Plus size={16} />
              {saving
                ? "保存中..."
                : editingId
                  ? "更新する"
                  : "投稿する"}
            </button>
            {editingId ? (
              <button
                type="button"
                className="button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                <X size={16} />
                キャンセル
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-bold">投稿済みのお知らせ</h2>
        <div className="mt-4 space-y-3">
          {initialAnnouncements.length ? (
            initialAnnouncements.map((announcement) => (
              <article
                key={announcement.id}
                className="card flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-xs font-bold text-[var(--primary)]">
                      {formatDate(announcement.publishedAt)}
                    </time>
                    {announcement.published ? null : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        下書き
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 font-bold">{announcement.title}</h3>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-slate-500">
                    {announcement.body}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="button-secondary px-3 py-1.5 text-xs"
                    onClick={() => startEdit(announcement)}
                  >
                    <Pencil size={14} />
                    編集
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
                    onClick={() => remove(announcement.id)}
                  >
                    <Trash2 size={14} className="inline" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="card p-5 text-sm text-slate-500">
              まだお知らせがありません。
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
