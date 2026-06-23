import { ArrowRight } from "lucide-react"

export function FinalCta({ primaryHref }: { primaryHref: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 pt-4">
      <div className="lp-fade-up bg-brand-gradient relative overflow-hidden rounded-3xl px-6 py-16 text-center shadow-xl sm:px-12">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-background/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-64 rounded-full bg-coral/20 blur-2xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight text-brand-foreground sm:text-4xl">
            <span className="sm:hidden">
              その「保存」を
              <br />
              次の企画に変えよう
            </span>
            <span className="hidden sm:inline">その「保存」を、次の企画に変えよう。</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-brand-foreground/80">
            <span className="sm:hidden">
              散らばったSNS投稿を、
              <br />
              AIが活かせる資産へ。
              <br />
              Postfolioは、無料で今すぐ始められます。
            </span>
            <span className="hidden sm:inline">
              散らばったSNS投稿を、AIが活かせる資産へ。
              <br />
              Postfolioは、無料で今すぐ始められます。
            </span>
          </p>
          <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 items-center justify-center gap-3 sm:flex sm:max-w-none sm:flex-row">
            <a
              href={primaryHref}
              className="bg-coral-gradient inline-flex items-center justify-center gap-2 rounded-full px-4 py-3.5 text-sm font-semibold text-coral-foreground shadow-lg transition-transform hover:scale-[1.03] sm:px-7"
            >
              無料で始める
              <ArrowRight className="size-4" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-background/30 bg-background/10 px-4 py-3.5 text-sm font-semibold text-brand-foreground backdrop-blur transition-colors hover:bg-background/20 sm:px-7"
            >
              <span className="sm:hidden">
                機能を
                <br />
                もう一度見る
              </span>
              <span className="hidden sm:inline">機能をもう一度見る</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

