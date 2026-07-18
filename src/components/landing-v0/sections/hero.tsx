import { ArrowRight, Sparkles } from "lucide-react";
import { AiAnalysisMock } from "@/components/landing-v0/mock/ai-analysis-mock";
import { LibraryMock } from "@/components/landing-v0/mock/library-mock";

const snsList = ["X", "Instagram", "Threads", "YouTube", "note", "Substack", "TikTok", "Bluesky", "Pinterest"];

export function Hero({ primaryHref }: { primaryHref: string }) {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#dbeafe_0%,#eef4ff_48%,#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 size-[28rem] rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute -right-24 top-32 size-[24rem] rounded-full bg-coral/10 blur-3xl" />
        <div className="absolute left-1/2 top-20 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-white/75 blur-3xl" />
        <div className="absolute -right-28 top-24 hidden w-[34rem] rotate-[30deg] opacity-[0.11] blur-[0.5px] lg:block">
          <LibraryMock compact />
        </div>
        <div className="absolute -left-36 top-[28rem] hidden w-[30rem] rotate-[30deg] opacity-[0.095] blur-[0.5px] xl:block">
          <LibraryMock compact />
        </div>
        <div className="absolute left-[44%] top-[34rem] hidden w-[28rem] rotate-[30deg] opacity-[0.075] blur-[0.5px] 2xl:block">
          <LibraryMock compact />
        </div>
        <div className="absolute right-[6%] top-[32rem] hidden w-[24rem] rotate-[30deg] opacity-[0.09] blur-[0.4px] xl:block">
          <AiAnalysisMock />
        </div>
        <div className="absolute left-[8%] top-28 hidden w-[22rem] rotate-[30deg] opacity-[0.07] blur-[0.4px] 2xl:block">
          <AiAnalysisMock />
        </div>
        <div className="absolute right-[24%] top-[48rem] hidden w-[26rem] rotate-[30deg] opacity-[0.075] blur-[0.4px] 2xl:block">
          <LibraryMock compact />
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-14 sm:pt-20">
        <div className="mx-auto max-w-6xl text-center">
          <div className="lp-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-white/86 px-4 py-1.5 text-xs font-medium text-navy shadow-sm backdrop-blur">
            <Sparkles className="size-3.5 text-brand" />
            クリエイターのためのSNSリサーチボックス
          </div>

          <h1
            className="lp-fade-up mx-auto mt-6 max-w-5xl text-balance text-[2.45rem] font-bold leading-tight tracking-tight text-navy sm:text-6xl md:text-[4.7rem]"
            style={{ animationDelay: "90ms" }}
          >
            <span className="sm:hidden">
              保存した
              <br />
              SNS投稿を
            </span>
            <span className="hidden sm:inline">保存したSNS投稿を</span>
            <br />
            <span className="text-brand-gradient whitespace-nowrap">リサーチカードに。</span>
          </h1>

          <p className="lp-fade-up mt-5 text-lg font-extrabold text-navy sm:text-xl" style={{ animationDelay: "180ms" }}>
            ようこそpostfolio(ポストフォリオ)へ
          </p>

          <p
            className="lp-fade-up mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "270ms" }}
          >
            <span className="sm:hidden">
              心を動かされた投稿を、
              <br />
              あとで探しやすいリサーチカードとして保存。
              <br />
              AIが要約・評価し、
              <br />
              「再利用するなら？」まで提案します。
            </span>
            <span className="hidden sm:inline">
              心を動かされた投稿を、あとで探しやすいリサーチカードとして保存。
              AIが要約・評価し、「再利用するなら？」まで提案します。
            </span>
          </p>

          <div
            className="lp-fade-up mx-auto mt-8 grid max-w-sm grid-cols-2 items-center justify-center gap-3 sm:flex sm:max-w-none sm:flex-row"
            style={{ animationDelay: "360ms" }}
          >
            <a
              href={primaryHref}
              className="bg-coral-gradient inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-coral-foreground shadow-lg shadow-coral/20 transition-transform hover:scale-[1.03] sm:px-7"
            >
              無料で始める
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-3.5 text-sm font-semibold text-navy transition-colors hover:bg-secondary sm:px-7"
            >
              機能を見る
            </a>
          </div>

          <div
            className="lp-fade-up bg-brand-gradient mx-auto mt-8 max-w-2xl rounded-3xl border border-white/30 px-6 py-5 shadow-xl shadow-brand/20"
            style={{ animationDelay: "450ms" }}
          >
            <p className="text-center text-sm font-extrabold uppercase tracking-[0.18em] text-white">
              幅広いSNSに対応
            </p>
            <div className="mx-auto mt-3 flex max-w-lg flex-wrap items-center justify-center gap-2">
              {snsList.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/30 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-navy shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/75">
              ※順次対応可能SNS追加予定
            </p>
          </div>
        </div>

        <div className="lp-fade-up relative mx-auto mt-14 max-w-4xl" style={{ animationDelay: "560ms" }}>
          <div className="bg-brand-gradient absolute -inset-x-6 -top-6 bottom-10 -z-10 rounded-[2rem] opacity-10 blur-2xl" />
          <div className="rounded-[1.8rem] border border-white/70 bg-white/45 p-2 shadow-2xl shadow-brand/15 backdrop-blur">
            <LibraryMock />
          </div>
        </div>
      </div>
    </section>
  );
}
