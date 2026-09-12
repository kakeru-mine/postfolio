"use client";

import { BarChart3, Bookmark, FolderOpen, Sparkles } from "lucide-react";
import { useState } from "react";

const SLIDES = [
  {
    icon: Sparkles,
    title: "ようこそPostfolioへ",
    body: "気になった様々な媒体のSNS投稿を\n一括で保存・整理できます",
  },
  {
    icon: Bookmark,
    title: "投稿を保存",
    body: "【コレクション】→【新規作成】で、コピーしたURLを\n貼り付けてSNS投稿を保存できます",
  },
  {
    icon: FolderOpen,
    title: "整理する",
    body: "【コレクション】と【タグ】で、\n投稿を目的別に整理できます。",
  },
  {
    icon: BarChart3,
    title: "AIで分析",
    body: "AIが\n【コンテンツの切り口】【投稿の評価】\nを生成します。",
  },
];

// A one-time welcome carousel shown on first login, covering the core loop:
// save posts, organize, analyze with AI. Whether it has been seen is an
// account-level flag (`seen`, from the server), so it shows only once per
// account across every device and browser.
export function OnboardingWelcome({ seen }: { seen: boolean }) {
  const [open, setOpen] = useState(!seen);
  const [step, setStep] = useState(0);

  function close() {
    setOpen(false);
    // Persist to the account so the guide never reappears on any device.
    void fetch("/api/onboarding/seen", { method: "POST" }).catch(() => {
      // Best-effort; a failure just means the guide may show again next time.
    });
  }

  if (!open) return null;

  const slide = SLIDES[step];
  const Icon = slide.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm">
      <div className="card relative w-full max-w-md p-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-5 text-sm font-bold text-slate-400 transition hover:text-slate-600"
        >
          スキップ
        </button>

        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary)]">
          <Icon size={30} />
        </div>
        <h3 className="mt-5 text-xl font-bold">{slide.title}</h3>
        <p className="mt-3 text-sm leading-7 whitespace-pre-line text-slate-500">
          {slide.body}
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setStep(index)}
              aria-label={`${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === step
                  ? "w-5 bg-[var(--primary)]"
                  : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="button-secondary justify-center px-6"
            >
              戻る
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (isLast ? close() : setStep((s) => s + 1))}
            className="button-primary flex-1 justify-center"
          >
            {isLast ? "始める" : "次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
