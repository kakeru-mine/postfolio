"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, CheckCircle2, XCircle } from "lucide-react";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("メールアドレスを確認しています...");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("確認リンクが正しくありません。");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus("error");
          setMessage(result.error ?? "確認に失敗しました。");
          return;
        }
        setStatus("success");
        setMessage("メールアドレスの確認が完了しました。");
        setTimeout(() => window.location.assign("/"), 1200);
      })
      .catch(() => {
        setStatus("error");
        setMessage("サーバーに接続できませんでした。");
      });
  }, []);

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
        <section className="card mt-7 p-6 text-center sm:p-8">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)]">
            {status === "verifying" ? (
              <LoaderCircle className="animate-spin text-[var(--primary)]" size={24} />
            ) : status === "success" ? (
              <CheckCircle2 className="text-emerald-600" size={26} />
            ) : (
              <XCircle className="text-rose-600" size={26} />
            )}
          </div>
          <h1 className="text-xl font-bold">メールアドレスの確認</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>

          {status === "error" ? (
            <Link
              href="/login"
              className="button-secondary mt-6 inline-flex justify-center"
            >
              ログイン画面へ
            </Link>
          ) : null}
        </section>
      </div>
    </main>
  );
}
