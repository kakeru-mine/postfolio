import { PenLine, Camera, Megaphone, BookOpen } from "lucide-react"

const cases = [
  {
    icon: PenLine,
    tag: "ライター / ブロガー",
    title: "ネタ帳としてのリサーチ",
    body: "伸びた投稿の書き出しや構成を保存。AIの講評で「型」を学び、自分の記事に応用する。",
  },
  {
    icon: Camera,
    tag: "フォトグラファー / デザイナー",
    title: "ビジュアルの参考帳",
    body: "構図・配色・サムネのアイデアをアルバムに蓄積。制作前に眺めて発想を広げる。",
  },
  {
    icon: Megaphone,
    tag: "SNS運用 / マーケター",
    title: "競合・トレンドの分析",
    body: "話題の投稿をコレクションで分類。再利用提案を企画会議のたたき台にする。",
  },
  {
    icon: BookOpen,
    tag: "小説家 / クリエイター",
    title: "作品づくりの素材箱",
    body: "気になる表現や設定を保存。AIに展開案を出させ、次の創作の起点にする。",
  },
]

export function UseCase() {
  return (
    <section id="usecase" className="scroll-mt-20 bg-[linear-gradient(135deg,#f5f3ff_0%,#eff6ff_52%,#fff7ed_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Use Cases</p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          <span className="sm:hidden">
            発信するすべての人の
            <br />
            相棒に
          </span>
          <span className="hidden sm:inline">発信するすべての人の、相棒に</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          <span className="sm:hidden">
            ジャンルを問わず、
            <br />
            「集めて、活かす」を続ける
            <br />
            クリエイターのために。
          </span>
          <span className="hidden sm:inline">
            ジャンルを問わず、「集めて、活かす」を続けるクリエイターのために。
          </span>
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {cases.map((c, i) => (
          <div
            key={c.title}
            className="lp-fade-up flex gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="bg-brand-gradient flex size-12 shrink-0 items-center justify-center rounded-xl shadow-sm">
              <c.icon className="size-5 text-brand-foreground" />
            </div>
            <div>
              <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                {c.tag}
              </span>
              <h3 className="mt-2 text-lg font-bold text-navy">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}

