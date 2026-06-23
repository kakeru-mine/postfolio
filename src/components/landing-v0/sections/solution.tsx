import { Save, FolderTree, Sparkles, ArrowRight } from "lucide-react"

const steps = [
  {
    no: "01",
    icon: Save,
    title: "保存する",
    body: "URLを貼るだけ。本文・画像・投稿者・投稿日まで、リサーチカードとして自動で整理。",
  },
  {
    no: "02",
    icon: FolderTree,
    title: "整理する",
    body: "コレクションとタグで用途別に分類。検索とSNS種別フィルターで一瞬で呼び出せる。",
  },
  {
    no: "03",
    icon: Sparkles,
    title: "再利用する",
    body: "AIが投稿を要約・評価し、「次の企画にどう使うか」まで提案。インプットが企画になる。",
  },
]

export function Solution() {
  return (
    <section className="bg-[linear-gradient(135deg,#eef2ff_0%,#dbeafe_48%,#f5f3ff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            The Solution
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            <span className="sm:hidden">
              Postfolioなら
              <br />
              保存が「資産」に
              <br />
              変わる
            </span>
            <span className="hidden sm:inline">Postfolioなら、保存が「資産」に変わる</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            <span className="sm:hidden">
              保存して終わりにしない。
              <br />
              3ステップで、SNS投稿が
              <br />
              あなたの企画の素材になります。
            </span>
            <span className="hidden sm:inline">
              保存して終わりにしない。
              <br />
              3ステップで、SNS投稿があなたの企画の素材になります。
            </span>
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.no} className="lp-fade-up relative" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="h-full rounded-2xl border border-border bg-card p-7 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="bg-brand-gradient flex size-11 items-center justify-center rounded-xl shadow-sm">
                    <s.icon className="size-5 text-brand-foreground" />
                  </div>
                  <span className="text-3xl font-bold text-secondary-foreground/15">{s.no}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-4 top-1/2 hidden size-6 -translate-y-1/2 text-brand/40 md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
