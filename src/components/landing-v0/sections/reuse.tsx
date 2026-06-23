import { Check } from "lucide-react"
import { AiAnalysisMock } from "@/components/landing-v0/mock/ai-analysis-mock"

const points = [
  {
    title: "投稿概要",
    body: "長い本文も、AIが要点を一段落で要約。何が良かったのかを一目で思い出せます。",
  },
  {
    title: "投稿の評価",
    body: "掴み・構成・ビジュアルの完成度をAIが講評。伸びる理由を言語化して学べます。",
  },
  {
    title: "再利用するなら？",
    body: "「この投稿を次の企画にどう活かすか」を具体的に提案。保存が、そのままアイデアになります。",
  },
]

export function Reuse() {
  return (
    <section id="reuse" className="scroll-mt-20 bg-navy">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-24 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-coral">
            Reuse, not just Save
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold leading-tight tracking-tight text-background sm:text-4xl">
            ただ保存するだけで、
            <br />
            終わらせない。
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-background/70">
            <span className="sm:hidden">
              Postfolioの本質は「保存後」にあります。
              <br />
              AIが保存した投稿を読み解き、評価し、
              <br />
              <span className="font-semibold text-background">「次にどう使うか」</span>まで提案。
              <br />
              <br />
              集めたインプットを、
              <br />
              アウトプットの素材へ変えていきます。
            </span>
            <span className="hidden sm:inline">
              Postfolioの本質は「保存後」にあります。AIが保存した投稿を読み解き、評価し、
              <span className="font-semibold text-background">「次にどう使うか」</span>
              まで提案。集めたインプットを、アウトプットの素材へ変えていきます。
            </span>
          </p>

          <div className="mt-8 space-y-5">
            {points.map((p, i) => (
              <div key={p.title} className="lp-fade-up flex gap-3" style={{ animationDelay: `${i * 110}ms` }}>
                <div className="bg-coral-gradient mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3.5 text-coral-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-background">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-background/65">{p.body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-background/50">
            ※ AIの回答は必ずしも正しいとは限りません。参考資料としてご活用ください。
          </p>
        </div>

        <div className="lp-fade-up relative" style={{ animationDelay: "180ms" }}>
          <div className="bg-brand-gradient absolute -inset-4 -z-10 rounded-[2rem] opacity-30 blur-2xl" />
          <AiAnalysisMock />
        </div>
      </div>
    </section>
  )
}

