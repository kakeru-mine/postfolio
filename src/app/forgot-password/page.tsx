"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const email = String(new FormData(event.currentTarget).get("email") ?? "");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(result.error ?? "送信に失敗しました。");
        return;
      }
      setSent(true);
      setMessage(result.message ?? "パスワード再設定用のメールを送信しました。");
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
          <h1 className="text-center text-2xl font-bold">パスワード再設定</h1>

          {sent ? (
            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
              {message}
            </div>
          ) : (
            <form className="mt-7 space-y-4" onSubmit={submit}>
              <p className="text-sm leading-6 text-slate-600">
                登録済みのメールアドレスを入力してください。再設定用のリンクをお送りします。
              </p>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">
                  メールアドレス
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 transition focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15">
                  <span className="text-slate-400">
                    <Mail size={17} />
                  </span>
                  <input
                    className="w-full bg-transparent outline-none"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="example@email.com"
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
                {submitting ? "送信中..." : "再設定メールを送信"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/login" className="font-bold text-[var(--primary)]">
              ログイン画面へ戻る
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
