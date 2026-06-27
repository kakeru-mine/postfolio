"use client";

import { LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registering = mode === "register";
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendNotice, setResendNotice] = useState("");

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setResendNotice("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const result = await response.json().catch(() => ({}));
      setResendNotice(result.message ?? "確認メールを再送しました。");
    } catch {
      setResendNotice("再送に失敗しました。時間をおいてお試しください。");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResendNotice("");
    setUnverifiedEmail("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const body = {
      ...(registering ? { name: String(formData.get("name") ?? "") } : {}),
      email,
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.code === "EMAIL_NOT_VERIFIED") {
          setUnverifiedEmail(email);
        }
        setError(result.error ?? "認証に失敗しました。");
        return;
      }

      if (result.pending) {
        setPendingMessage(
          result.message ??
            "確認メールを送信しました。メール内のリンクから登録を完了してください。",
        );
        return;
      }

      window.location.assign("/");
    } catch {
      setError("サーバーに接続できませんでした。");
    } finally {
      setSubmitting(false);
    }
  }

  if (pendingMessage) {
    return (
      <div className="mt-7 space-y-4 text-center">
        <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
          {pendingMessage}
        </div>
        <p className="text-sm text-slate-500">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </p>
        <Link
          href="/login"
          className="button-secondary inline-flex justify-center"
        >
          ログイン画面へ
        </Link>
      </div>
    );
  }

  return (
    <form className="mt-7 space-y-4" onSubmit={submit}>
      {registering ? (
        <AuthField icon={<UserRound size={17} />} label="表示名">
          <input
            className="w-full bg-transparent outline-none"
            name="name"
            autoComplete="name"
            required
            maxLength={50}
            placeholder="表示名を入力"
          />
        </AuthField>
      ) : null}
      <AuthField icon={<Mail size={17} />} label="メールアドレス">
        <input
          className="w-full bg-transparent outline-none"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="example@email.com"
        />
      </AuthField>
      <AuthField icon={<LockKeyhole size={17} />} label="パスワード">
        <input
          className="w-full bg-transparent outline-none"
          name="password"
          type="password"
          autoComplete={registering ? "new-password" : "current-password"}
          required
          minLength={registering ? 8 : 1}
          maxLength={128}
          placeholder={registering ? "8文字以上" : "パスワードを入力"}
        />
      </AuthField>

      {error ? (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : null}

      {unverifiedEmail ? (
        <div className="space-y-2 text-center">
          <button
            type="button"
            onClick={resendVerification}
            className="text-sm font-bold text-[var(--primary)] underline"
          >
            確認メールを再送する
          </button>
          {resendNotice ? (
            <p className="text-xs text-slate-500">{resendNotice}</p>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        className="button-primary w-full justify-center py-3.5"
        disabled={submitting}
      >
        {submitting ? <LoaderCircle className="animate-spin" size={18} /> : null}
        {submitting
          ? "処理中..."
          : registering
            ? "無料で会員登録"
            : "ログイン"}
      </button>

      {!registering ? (
        <p className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="font-bold text-[var(--primary)]"
          >
            パスワードをお忘れですか？
          </Link>
        </p>
      ) : null}

      <p className="text-center text-sm text-slate-500">
        {registering ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}
        <Link
          href={registering ? "/login" : "/register"}
          className="ml-2 font-bold text-[var(--primary)]"
        >
          {registering ? "ログイン" : "会員登録"}
        </Link>
      </p>
    </form>
  );
}

function AuthField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-600">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 transition focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/15">
        <span className="text-slate-400">{icon}</span>
        {children}
      </span>
    </label>
  );
}
