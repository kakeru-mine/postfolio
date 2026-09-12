"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token"));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const password = String(
      new FormData(event.currentTarget).get("password") ?? "",
    );

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "再設定に失敗しました。");
        return;
      }
      setDone(true);
    } catch {
      setError("サーバーに接続できませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/welcome" className="mx-auto block w-fit">
          <Image
            src="/postfolio-logo.png"
            alt="Postfolio"
            width={240}
            height={84}
            className="h-14 w-auto"
            priority
          />
        </Link>
        <section className="card mt-7 p-6 sm:p-8">
          <h1 className="text-center text-2xl font-bold">新しいパスワード</h1>

          {done ? (
            <div className="mt-6 space-y-5 text-center">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
                パスワードを再設定しました。新しいパスワードでログインしてください。
              </div>
              <Link href="/login" className="button-primary inline-flex justify-center">
                ログインする
              </Link>
            </div>
          ) : token === null ? (
            <p className="mt-6 text-center text-sm leading-6 text-slate-600">
              読み込み中です...
            </p>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={submit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">
                  新しいパスワード
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 transition focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15">
                  <span className="text-slate-400">
                    <LockKeyhole size={17} />
                  </span>
                  <input
                    className="w-full bg-transparent outline-none"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={128}
                    placeholder="8文字以上"
                  />
                </span>
              </label>

              {error ? (
                <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="button-primary w-full justify-center py-3.5"
                disabled={submitting}
              >
                {submitting ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : null}
                {submitting ? "再設定中..." : "パスワードを再設定"}
              </button>
            </form>
          )}
        </section>
      </div>
      <StandaloneLanguageControls className="fixed right-4 top-4 z-50" />
    </main>
  );
}
