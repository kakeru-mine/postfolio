"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, CheckCircle2, XCircle } from "lucide-react";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";

type Status = "verifying" | "success" | "error";

// Deep link back into the mobile app once verification succeeds. The app
// registers the `postfolio://` scheme, so this reopens it (to the login screen).
const APP_DEEP_LINK = "postfolio://email-verified";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("メールアドレスを確認しています...");
  // Registrations started from the mobile app pass ?source=app, so we send the
  // user back into the app instead of the web dashboard.
  const [fromApp, setFromApp] = useState(false);
  // Deep link carrying the bearer session token, so tapping "Open app" signs
  // the user straight into the app (falls back to opening it if no token).
  const [appLink, setAppLink] = useState(APP_DEEP_LINK);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const isApp = params.get("source") === "app";
    setFromApp(isApp);
    if (!token) {
      setStatus("error");
      setMessage("確認リンクが正しくありません。");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, source: isApp ? "app" : "web" }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus("error");
          setMessage(result.error ?? "確認に失敗しました。");
          return;
        }
        setStatus("success");
        if (isApp) {
          if (result.sessionToken) {
            setAppLink(
              `${APP_DEEP_LINK}?token=${encodeURIComponent(result.sessionToken)}`,
            );
          }
          setMessage(
            "メールアドレスの確認が完了しました。\n下のボタンからアプリに戻ってログインしてください。",
          );
        } else {
          setMessage("メールアドレスの確認が完了しました。");
          setTimeout(() => window.location.assign("/"), 1200);
        }
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
          <p className="mt-3 text-sm leading-6 whitespace-pre-line text-slate-600">
            {message}
          </p>

          {status === "success" && fromApp ? (
            <a
              href={appLink}
              className="button-primary mt-6 inline-flex justify-center"
            >
              アプリを開く
            </a>
          ) : null}

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
      <StandaloneLanguageControls className="fixed right-4 top-4 z-50" />
    </main>
  );
}
