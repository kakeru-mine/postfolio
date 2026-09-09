"use client";

import { CheckCircle2, ChevronRight, Circle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISS_KEY = "postfolio-checklist-dismissed";

// A getting-started checklist shown on the home page until every step is done or
// the user dismisses it. Progress is derived from the user's real data.
export function OnboardingChecklist({
  savedDone,
  analyzeDone,
  collectionDone,
}: {
  savedDone: boolean;
  analyzeDone: boolean;
  collectionDone: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
  }

  const steps = [
    { label: "最初の投稿を保存する", href: "/items", done: savedDone },
    { label: "AI分析を試す", href: "/items", done: analyzeDone },
    { label: "コレクションを作成する", href: "/collections", done: collectionDone },
  ];
  const completed = steps.filter((s) => s.done).length;
  const allDone = completed === steps.length;

  if (dismissed || allDone) return null;

  return (
    <section className="mt-8 rounded-2xl border border-[var(--primary)]/30 bg-[var(--accent-soft)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[var(--ink)]">はじめかた</h2>
          <p className="mt-1 text-sm text-slate-500">
            3ステップでPostfolioを使いこなしましょう。
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/60 hover:text-slate-600"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-all"
          style={{ width: `${(completed / steps.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {steps.map((step) =>
          step.done ? (
            <li
              key={step.label}
              className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm"
            >
              <CheckCircle2 size={20} className="shrink-0 text-[var(--primary)]" />
              <span className="text-slate-400 line-through">{step.label}</span>
            </li>
          ) : (
            <li key={step.label}>
              <Link
                href={step.href}
                className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-white/70"
              >
                <Circle size={20} className="shrink-0 text-slate-400" />
                <span className="flex-1">{step.label}</span>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
