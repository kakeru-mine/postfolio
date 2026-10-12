"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Trash2, TriangleAlert } from "lucide-react";

// Self-service account deletion. A typed confirmation ("削除") guards against
// accidental deletion; on success the account and all its data are erased and
// the user is sent back to the login page.
export function AccountDeleteSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const canDelete = confirmText.trim() === "削除";

  async function remove() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.error ?? "削除できませんでした。");
        setDeleting(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("削除できませんでした。時間をおいて再度お試しください。");
      setDeleting(false);
    }
  }

  return (
    <section className="mt-8 rounded-[var(--radius-card)] border border-slate-200 bg-white/80 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-[0.18em] text-slate-400 uppercase">
            Account
          </p>
          <h2 className="mt-2 text-xl font-bold">アカウント削除について</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            <span className="block">
              アカウントを削除すると、保存投稿・コレクション・タグ・AI分析結果・設定情報がすべて削除され、元に戻せません。
            </span>
            <span className="block">
              有料プランをご利用中の場合は、先に解約手続きをお願いいたします。
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setConfirmText("");
            setError("");
            setOpen(true);
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 sm:mt-9 sm:w-40 sm:shrink-0 sm:text-xs lg:w-44"
        >
          <Trash2 size={16} className="shrink-0" />
          <span className="text-center leading-tight">
            アカウントの
            <br className="hidden sm:inline" />
            削除
          </span>
        </button>
      </div>

      {open ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setOpen(false);
          }}
        >
          <div
            className="card w-full max-w-md p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-delete-title"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <TriangleAlert size={22} />
            </div>
            <h3
              id="account-delete-title"
              className="mt-4 text-center text-lg font-bold"
            >
              アカウントを削除しますか？
            </h3>
            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              すべてのデータが完全に削除され、元に戻せません。続ける場合は
              <span className="font-bold text-rose-600">「削除」</span>
              と入力してください。
            </p>
            <input
              className="field mt-4"
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder="削除"
              aria-label="確認のため 削除 と入力"
            />
            {error ? (
              <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={remove}
                disabled={deleting || !canDelete}
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
    </section>
  );
}
