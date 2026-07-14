import { LayoutGrid, Search, Layers, Tag, RefreshCw, Globe } from "lucide-react"

const features = [
  {
    icon: LayoutGrid,
    title: "投稿アルバム",
    body: "保存した投稿はサムネイル付きカードに。眺めるだけで楽しい、あなただけのビジュアルライブラリ。",
  },
  {
    icon: Globe,
    title: "マルチSNS対応",
    body: "X / Instagram / Threads / YouTube / note / Substack / TikTok / Reddit。主要SNSを横断して一元管理。",
  },
  {
    icon: Search,
    title: "横断検索",
    body: "タイトル・メモ・URLから瞬時に検索。SNS種別フィルターで「あの投稿」にすぐ辿り着く。",
  },
  {
    icon: Layers,
    title: "コレクション",
    body: "「コンテンツ企画」「ビジュアル研究」など、用途やテーマごとにフォルダで分類。",
  },
  {
    icon: Tag,
    title: "タグ & メモ",
    body: "参考になったポイントや次のアクションを書き留める。投稿が自分専用の資料になる。",
  },
  {
    icon: RefreshCw,
    title: "SNS情報の再取得",
    body: "ワンクリックで元投稿の情報を最新化。AI分析もいつでもやり直せる。",
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 bg-white px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Features</p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          <span className="sm:hidden">
            リサーチに
            <br />
            必要なものが
            <br />
            ぜんぶ揃う
          </span>
          <span className="hidden sm:inline">リサーチに必要なものが、ぜんぶ揃う</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          <span className="sm:hidden">
            保存・整理・検索・再利用。
            <br />
            クリエイターの「集めて活かす」を、
            <br />
            ひとつの場所で。
          </span>
          <span className="hidden sm:inline">
            保存・整理・検索・再利用。
            <br />
            クリエイターの「集めて活かす」を、ひとつの場所で。
          </span>
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="lp-fade-up group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand/10 transition-colors group-hover:bg-brand/15">
              <f.icon className="size-5 text-brand" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-navy">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

