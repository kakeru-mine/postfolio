"use client";

import { useState } from "react";
import { Code2, Link2 } from "lucide-react";

const SHARE_TEXT =
  "Postfolio｜SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。";

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "https://postfolio-sigma.vercel.app"
  );
}

function lpUrl(source?: string) {
  const base = `${baseUrl()}/welcome`;
  return source ? `${base}?utm_source=${source}&utm_medium=share` : base;
}

export function ShareButtons() {
  const [copied, setCopied] = useState<"" | "link" | "embed">("");

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    SHARE_TEXT,
  )}&url=${encodeURIComponent(lpUrl("x"))}`;
  const threadsHref = `https://www.threads.net/intent/post?text=${encodeURIComponent(
    `${SHARE_TEXT}\n${lpUrl("threads")}`,
  )}`;
  const lineHref = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    lpUrl("line"),
  )}`;
  const embedCode = `<a href="${lpUrl("embed")}" target="_blank" rel="noopener">Postfolio｜SNSリサーチボックス</a>`;

  async function copy(text: string, kind: "link" | "embed") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white">シェア</h3>
      <div className="mt-3 flex flex-wrap items-start gap-4">
        <ShareLink href={xHref} label="X">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </ShareLink>
        <ShareLink href={threadsHref} label="Threads">
          <svg viewBox="0 0 192 192" width="19" height="19" fill="currentColor" aria-hidden="true">
            <path d="M141.5 88.4c-.7-.3-1.4-.6-2.1-.9-1.2-22.8-13.7-35.9-34.7-36-9.5-.1-17.5 2.4-23.5 7.5l9.9 11.1c4.3-3.6 9.5-4.6 14-4.6 5.7.1 10 1.7 12.7 4.9 2 2.3 3.3 5.5 4 9.5-5.2-.9-10.8-1.2-16.8-.8-16.9 1-27.8 10.8-27 24.5.4 6.9 3.8 12.9 9.7 16.8 5 3.3 11.4 4.9 18.1 4.5 8.9-.5 15.8-3.9 20.7-10.1 3.7-4.7 6.1-10.8 7.1-18.5 4.1 2.5 7.2 5.8 8.9 9.8 2.9 6.8 3 18-6.1 27.1-8 8-17.6 11.4-32.1 11.5-16.1-.1-28.2-5.3-36-15.4-7.3-9.5-11.1-23.2-11.2-40.7.1-17.5 3.9-31.2 11.2-40.7 7.8-10.1 19.9-15.3 36-15.4 16.2.1 28.5 5.3 36.6 15.5 4 5 7 11.3 9 18.7l15.5-4.1c-2.4-9.1-6.2-16.9-11.4-23.5-10.4-13.1-25.6-19.8-45.2-20h-.1c-19.6.2-34.6 7-44.7 20.1C24.3 50.9 19.4 67.8 19.3 89v.1c.1 21.3 5 38.2 14.6 50.3 10.1 13.1 25.1 19.9 44.7 20.1h.1c17.4-.1 29.7-4.7 39.8-14.8 13.3-13.2 12.9-29.8 8.5-40-3.2-7.3-9.2-13.3-17.5-17.3zm-37.4 26.6c-7.4.4-15.1-2.9-15.5-10-.3-5.3 3.8-11.2 16-11.9 1.4-.1 2.7-.1 4-.1 4.4 0 8.6.4 12.3 1.3-1.4 17.2-9.5 20.4-16.8 20.7z" />
          </svg>
        </ShareLink>
        <ShareLink href={lineHref} label="LINE" badge="#06C755">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5c5.52 0 10 3.6 10 8.05 0 1.79-.71 3.4-2.05 4.86-1.95 2.24-6.3 4.97-7.29 5.39-.96.4-.84-.26-.8-.49l.13-.79c.03-.24.06-.6-.03-.83-.1-.25-.5-.38-.79-.44C6.04 19.4 2 15.66 2 10.55 2 6.1 6.48 2.5 12 2.5zM9.27 8.6h-.7c-.11 0-.2.09-.2.2v4.36c0 .11.09.2.2.2h.7c.11 0 .2-.09.2-.2V8.8c0-.11-.09-.2-.2-.2zm8.04 0h-.7c-.11 0-.2.09-.2.2v2.59L14.4 8.69l-.02-.02-.01-.02-.02-.01h-.02l-.01-.01h-.74c-.11 0-.2.09-.2.2v4.36c0 .11.09.2.2.2h.7c.11 0 .2-.09.2-.2v-2.59l2.01 2.71c.01.02.03.04.05.05l.02.01h.75c.11 0 .2-.09.2-.2V8.8c0-.11-.09-.2-.2-.2zm-9.62 3.66H6.16V8.8c0-.11-.09-.2-.2-.2h-.7c-.11 0-.2.09-.2.2v4.36c0 .05.02.1.06.14.04.04.08.06.14.06h2.83c.11 0 .2-.09.2-.2v-.7c0-.11-.09-.2-.2-.2zm4.5-3.66h-2.83c-.11 0-.2.09-.2.2v4.36c0 .11.09.2.2.2h2.83c.11 0 .2-.09.2-.2v-.7c0-.11-.09-.2-.2-.2h-1.93v-.74h1.93c.11 0 .2-.09.2-.2v-.7c0-.11-.09-.2-.2-.2h-1.93V9.7h1.93c.11 0 .2-.09.2-.2v-.7c0-.11-.09-.2-.2-.2z" />
          </svg>
        </ShareLink>
        <ShareButton label="リンク" onClick={() => copy(lpUrl(), "link")}>
          <Link2 size={18} />
        </ShareButton>
        <ShareButton label="埋め込み" onClick={() => copy(embedCode, "embed")}>
          <Code2 size={18} />
        </ShareButton>
      </div>
      {copied ? (
        <p className="mt-2 text-xs text-white/85">
          {copied === "link"
            ? "リンクをコピーしました。"
            : "埋め込みコードをコピーしました。"}
        </p>
      ) : null}
    </div>
  );
}

function plateClass() {
  return "rounded-2xl bg-white p-1 shadow-sm transition group-hover:-translate-y-0.5 group-hover:shadow-md";
}

function ShareLink({
  href,
  label,
  badge = "#0f172a",
  children,
}: {
  href: string;
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}でシェア`}
      className="group flex flex-col items-center gap-1.5"
    >
      <span className={plateClass()}>
        <span
          className="grid size-9 place-items-center rounded-xl text-white"
          style={{ backgroundColor: badge }}
        >
          {children}
        </span>
      </span>
      <span className="text-xs font-medium text-white/85">{label}</span>
    </a>
  );
}

function ShareButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex flex-col items-center gap-1.5"
    >
      <span className={plateClass()}>
        <span className="grid size-9 place-items-center rounded-xl bg-[#0f172a] text-white">
          {children}
        </span>
      </span>
      <span className="text-xs font-medium text-white/85">{label}</span>
    </button>
  );
}
