"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { ManualHelpButton } from "@/components/manual-help-button";

type Analysis = {
  summary: string | null;
  rating: "S" | "A" | "B" | "C" | "D" | "E" | null;
  growthReason: string | null;
  contentAngles: string[];
  reuseSuggestion: string | null;
};

export function AiAnalysisPanel({
  itemId,
  initialAnalysis,
  leadingAction,
}: {
  itemId: string;
  initialAnalysis: Analysis;
  leadingAction?: React.ReactNode;
}) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasAnalysis = Boolean(
    analysis.summary ||
      analysis.rating ||
      analysis.growthReason ||
      analysis.contentAngles.length ||
      analysis.reuseSuggestion,
  );

  async function analyze() {
    setAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/ai/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "AI分析に失敗しました。");
        return;
      }

      setAnalysis(result.analysis);
      router.refresh();
    } catch {
      setError("AI分析に接続できませんでした。");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary-dark)]">
            <Sparkles size={19} />
          </span>
          <div>
            <h2 className="text-lg font-bold">AI分析</h2>
            <p className="text-xs text-slate-400">
              投稿内容をAIが分析します
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {leadingAction}
          <ManualHelpButton topics={["ai"]} />
          <button
            type="button"
            className="button-primary px-4 py-2.5 text-sm"
            onClick={() => setConfirmOpen(true)}
            disabled={analyzing}
          >
            {analyzing ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : hasAnalysis ? (
              <RefreshCw size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {analyzing ? "分析中..." : hasAnalysis ? "再分析" : "AIで分析"}
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs leading-5 text-rose-400 sm:text-right">
        ※ AI の回答は必ずしも正しいとは限りません。参考資料としてご確認ください
      </p>

      {error ? (
        <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
          {error}
        </div>
      ) : null}

      {hasAnalysis ? (
        <div className="mt-6 space-y-6">
          <h3 className="text-base font-bold text-[var(--ink)]">分析結果</h3>

          {analysis.summary ? (
            <section>
              <SectionTitle icon={<Sparkles size={16} />} label="投稿概要" />
              <p className="mt-2 leading-7 text-slate-600">{analysis.summary}</p>
            </section>
          ) : null}

          {analysis.contentAngles.length ||
          analysis.growthReason ||
          analysis.reuseSuggestion ? (
            <section>
              <div className="mt-4 space-y-5">
                {analysis.contentAngles.length ? (
                  <AnalysisList
                    icon={<Lightbulb size={16} />}
                    title="コンテンツの切り口"
                    items={analysis.contentAngles}
                  />
                ) : null}

                {analysis.growthReason ? (
                  <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-[#fffaf0] via-white to-[#f5f1ff]">
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start">
                      {analysis.rating ? (
                        <RatingBadge rating={analysis.rating} />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <SectionTitle
                          icon={<TrendingUp size={16} />}
                          label="投稿の評価"
                        />
                        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                          {splitSentences(analysis.growthReason).map(
                            (sentence, index) => (
                              <p key={`${sentence}-${index}`}>{sentence}</p>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {analysis.reuseSuggestion ? (
                  <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                    <SectionTitle
                      icon={<Sparkles size={16} />}
                      label="再利用するなら？"
                    />
                    <ul className="mt-3 space-y-2.5">
                      {splitReuseIdeas(analysis.reuseSuggestion).map(
                        (idea, index) => (
                          <li
                            key={`${idea}-${index}`}
                            className="flex gap-2 text-sm leading-7 text-slate-600"
                          >
                            <span className="mt-3 size-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                            <span>{idea}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </section>
                ) : null}
              </div>
            </section>
          ) : null}

        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[var(--primary)] bg-[var(--accent-soft)] p-7 text-center">
          <p className="font-bold text-[var(--primary-dark)]">
            まだ分析されていません
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            投稿概要、コンテンツの切り口、E〜S段階の投稿評価を生成します。
          </p>
        </div>
      )}

      {confirmOpen ? (
        <div
          className="theme-overlay fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmOpen(false);
          }}
        >
          <div
            className="card w-full max-w-md p-6 text-center shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-confirm-title"
          >
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary)]">
              <AlertCircle size={22} />
            </div>
            <h3 id="ai-confirm-title" className="mt-4 text-lg font-bold">
              AI分析を実行しますか？
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              この投稿をAIで分析します。実行するとAI分析回数を1件消費します。
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="button-secondary justify-center"
                onClick={() => setConfirmOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="button-primary justify-center"
                onClick={() => {
                  setConfirmOpen(false);
                  void analyze();
                }}
              >
                AI分析を実行
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionTitle({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
      <span className="text-[var(--primary)]">{icon}</span>
      {label}
    </h3>
  );
}

const ratingStyles = {
  S: "from-fuchsia-500 via-violet-500 to-amber-400 shadow-fuchsia-300/50",
  A: "from-violet-600 via-blue-500 to-cyan-400 shadow-blue-300/50",
  B: "from-blue-600 to-sky-400 shadow-sky-300/40",
  C: "from-emerald-500 to-teal-400 shadow-emerald-300/40",
  D: "from-amber-500 to-orange-400 shadow-orange-300/40",
  E: "from-slate-500 to-slate-400 shadow-slate-300/40",
} as const;

function RatingBadge({ rating }: { rating: keyof typeof ratingStyles }) {
  return (
    <div className="shrink-0 text-center">
      <p className="text-[10px] font-black tracking-[0.22em] text-slate-400 uppercase">
        AI Rating
      </p>
      <div
        className={`mt-2 grid size-24 place-items-center rounded-3xl bg-gradient-to-br ${ratingStyles[rating]} shadow-xl ring-4 ring-white`}
      >
        <span className="text-6xl font-black italic leading-none tracking-tighter text-white drop-shadow-md">
          {rating}
        </span>
      </div>
    </div>
  );
}

function splitSentences(value: string) {
  const sentences = value.match(/[^。！？!?]+[。！？!?]?/g);
  return sentences?.map((sentence) => sentence.trim()).filter(Boolean) ?? [value];
}

function splitReuseIdeas(value: string) {
  const ideas = value
    .split(/\r?\n|(?:^|\s)[・\-*]\s*/g)
    .map((idea) => idea.replace(/^[・\-*]\s*/, "").trim())
    .filter(Boolean);

  return ideas.length ? ideas : splitSentences(value);
}

function AnalysisList({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-slate-50/70 p-5">
      <SectionTitle icon={icon} label={title} />
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
