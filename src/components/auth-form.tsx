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

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">または</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <a
        href="/api/auth/google/start"
        className="button-secondary w-full justify-center gap-2 py-3.5"
      >
        <GoogleIcon />
        Googleで続ける
      </a>

      <p className="text-center text-xs leading-5 text-slate-400">
        続行することで、
        <Link href="/terms" className="underline hover:text-slate-600">
          利用規約
        </Link>
        ・
        <Link href="/privacy" className="underline hover:text-slate-600">
          プライバシーポリシー
        </Link>
        に
        <br />
        同意したものとみなします。
      </p>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
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
