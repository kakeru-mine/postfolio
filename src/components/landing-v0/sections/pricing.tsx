import { Check } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "¥0",
    period: "",
    tagline: "まずは個人のSNSリサーチを始めたい方へ",
    features: ["保存枠 30件", "AI分析 1日1件"],
    cta: "無料で始める",
    popular: false,
  },
  {
    name: "Pro",
    price: "¥500",
    period: "/月",
    tagline: "日常的に企画や発信へ活用する方へ",
    features: ["保存枠 200件", "AI分析 月100件"],
    cta: "Proを始める",
    popular: true,
  },
  {
    name: "Creator",
    price: "¥980",
    period: "/月",
    tagline: "多くの投稿を蓄積・分析するクリエイターへ",
    features: ["保存枠 500件", "AI分析 月200件"],
    cta: "Creatorを始める",
    popular: false,
  },
]

export function Pricing({ ctaHref }: { ctaHref: string }) {
  return (
    <section id="pricing" className="scroll-mt-20 bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Simple Monthly Plans
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            シンプルな、月額プラン
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            <span className="sm:hidden">
              まずは無料で。
              <br />
              物足りなくなったら、
              <br />
              いつでもアップグレードできます。
            </span>
            <span className="hidden sm:inline">
              まずは無料で。物足りなくなったら、いつでもアップグレードできます。
            </span>
          </p>
        </div>

        <div className="mt-12 grid items-start gap-4 md:gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={`lp-fade-up relative rounded-2xl border bg-card p-5 shadow-sm md:p-7 ${
                p.popular ? "border-brand shadow-lg shadow-brand/10 md:-translate-y-3" : "border-border"
              }`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              {p.popular && (
                <span className="bg-brand-gradient absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-semibold text-brand-foreground shadow-sm">
                  おすすめ
                </span>
              )}
              <div className="flex items-start justify-between gap-4 md:block">
                <div>
                  <h3 className="text-lg font-bold text-navy">{p.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.tagline}</p>
                </div>
                <div className="flex shrink-0 items-baseline gap-1 md:mt-5">
                  <span className="text-3xl font-bold text-navy md:text-4xl">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
              </div>

              <a
                href={ctaHref}
                className={`mt-4 block rounded-full px-5 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.02] md:mt-6 ${
                  p.popular
                    ? "bg-coral-gradient text-coral-foreground shadow-md shadow-coral/20"
                    : "border border-border bg-card text-navy hover:bg-secondary"
                }`}
              >
                {p.cta}
              </a>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:mt-6 md:block md:space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-navy">
                    <span className="bg-brand/10 flex size-5 shrink-0 items-center justify-center rounded-full">
                      <Check className="size-3 text-brand" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

