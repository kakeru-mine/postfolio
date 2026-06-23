"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";

export function AccountDeleteSection({
  hasActivePaidSubscription,
}: {
  hasActivePaidSubscription: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canDelete = confirmation === "DELETE";

  async function deleteAccount() {
    if (!canDelete) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "退会処理に失敗しました。");
        return;
      }
      window.location.href = "/welcome";
    } catch {
      setError("退会処理に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-[var(--radius-card)] border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tracking-[0.18em] text-rose-500 uppercase">
            Danger Zone
          </p>
          <h2 className="mt-2 text-xl font-bold">アカウント削除</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            アカウントを削除すると、保存投稿、コレクション、タグ、AI分析結果、設定情報が削除されます。
            <br className="hidden sm:block" />
            この操作は元に戻せません。
          </p>
          {hasActivePaidSubscription ? (
            <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-700">
              有料プラン契約中です。
              <br className="hidden sm:block" />
              退会する前に、プラン一覧からFreeへの変更予約を行い、契約期間終了後に退会してください。
            </p>
          ) : null}
        </div>
        {hasActivePaidSubscription ? (
          <Link
            href="/pricing"
            className="button-secondary w-full justify-center px-4 py-2.5 text-sm sm:mt-9 sm:w-32 sm:shrink-0 sm:text-xs lg:w-36"
          >
            プランを確認
          </Link>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700"
            onClick={() => {
              setError("");
              setConfirmation("");
              setOpen(true);
            }}
          >
            <Trash2 size={17} />
            退会する
          </button>
        )}
      </div>

      {open ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) {
              setOpen(false);
            }
          }}
        >
          <div
            className="card w-full max-w-md p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle size={23} />
            </div>
            <h3 id="delete-account-title" className="mt-4 text-xl font-bold">
              アカウントを削除しますか？
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              削除すると、保存投稿やコレクションなどのデータは元に戻せません。確認のため、下の入力欄に
              <span className="font-bold text-slate-800"> DELETE </span>
              と入力してください。
            </p>
            <input
              className="field mt-4"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="DELETE"
              autoFocus
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
                disabled={loading}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                onClick={() => void deleteAccount()}
                disabled={!canDelete || loading}
              >
                {loading ? <LoaderCircle className="animate-spin" size={17} /> : null}
                {loading ? "削除中..." : "完全に削除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
