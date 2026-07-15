import { Search, Plus, SlidersHorizontal, Check } from "lucide-react"
import Image from "next/image"

const snsFilters = ["すべて", "X", "Instagram", "Threads", "YouTube", "note", "Substack", "TikTok", "Reddit", "Bluesky"]

type Post = {
  img: string
  sns: string
  title: string
  excerpt: string
  collection: string
  date: string
}

const posts: Post[] = [
  {
    img: "/landing/mock/post-1.png",
    sns: "note",
    title: "夜の部屋で出会う、しゃべる鏡の話",
    excerpt: "引っ越し直後・ひとりぼっちの不穏さが世界観を強めている冒頭シーン。",
    collection: "創作の参考",
    date: "6月20日",
  },
  {
    img: "/landing/mock/post-3.png",
    sns: "Instagram",
    title: "映えるカフェメニューの撮り方メモ",
    excerpt: "自然光と俯瞰アングルで、彩度を上げずに美味しそうに見せる構図。",
    collection: "ビジュアル研究",
    date: "6月18日",
  },
  {
    img: "/landing/mock/post-6.png",
    sns: "TikTok",
    title: "1本目で離脱させないフックの作り方",
    excerpt: "冒頭2秒のテロップとカット割りで視聴維持率が変わる事例。",
    collection: "コンテンツ企画",
    date: "6月15日",
  },
  {
    img: "/landing/mock/post-2.png",
    sns: "X",
    title: "伸びた投稿に共通する書き出しパターン",
    excerpt: "問いかけ→共感→意外性の3段構成。保存数が多いポストの型。",
    collection: "ライティング",
    date: "6月14日",
  },
  {
    img: "/landing/mock/post-4.png",
    sns: "YouTube",
    title: "旅Vlogのサムネ構成リファレンス",
    excerpt: "風景＋人物＋大きめ文字。クリック率の高いサムネの黄金比。",
    collection: "ビジュアル研究",
    date: "6月12日",
  },
  {
    img: "/landing/mock/post-5.png",
    sns: "Substack",
    title: "ブランドの世界観をつくる配色設計",
    excerpt: "パステル×余白でやさしさを演出。プロダクト紹介の参考に。",
    collection: "ブランディング",
    date: "6月10日",
  },
]

const snsColor: Record<string, string> = {
  note: "text-emerald-600",
  Instagram: "text-pink-600",
  TikTok: "text-navy",
  X: "text-navy",
  YouTube: "text-red-600",
  Substack: "text-orange-600",
  Reddit: "text-orange-500",
  Bluesky: "text-sky-500",
}

export function LibraryMock({ compact = false }: { compact?: boolean }) {
  const visiblePosts = compact ? posts.slice(0, 3) : posts;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-brand/10">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="size-3 rounded-full bg-coral/70" />
        <span className="size-3 rounded-full bg-chart-5/40" />
        <span className="size-3 rounded-full bg-brand/40" />
        <span className="ml-3 truncate text-xs font-medium text-muted-foreground">
          postfolio.app / 保存アイテム
        </span>
      </div>

      <div className={compact ? "p-3 sm:p-4" : "p-4 sm:p-5"}>
        {/* title row */}
        <div className={compact ? "mb-3 flex items-start justify-between gap-3" : "mb-4 flex items-start justify-between gap-3"}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              Your Research Library
            </p>
            <h3 className={compact ? "mt-0.5 text-lg font-bold text-navy" : "mt-0.5 text-xl font-bold text-navy"}>
              保存アイテム
            </h3>
          </div>
          <div className="bg-coral-gradient flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-coral-foreground shadow-sm">
            <Plus className="size-3.5" />
            新規作成
          </div>
        </div>

        {/* search + filters */}
        <div className={compact ? "rounded-xl border border-border bg-surface p-2.5" : "rounded-xl border border-border bg-surface p-3"}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">タイトル、メモ、URLで検索</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:block">
                すべてのコレクション
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-navy">
                <SlidersHorizontal className="size-3.5" />
                絞り込む
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {snsFilters.map((f, i) => (
              <span
                key={f}
                className={
                  i === 0
                    ? "bg-brand rounded-full px-3 py-1 text-[11px] font-semibold text-brand-foreground"
                    : "rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground"
                }
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* count */}
        <p className={compact ? "mb-2 mt-3 text-xs font-semibold text-muted-foreground" : "mb-3 mt-4 text-xs font-semibold text-muted-foreground"}>
          {posts.length}件
        </p>

        {/* grid */}
        <div className="grid grid-cols-3 gap-3">
          {visiblePosts.map((p, i) => (
            <div
              key={p.title}
              className="lp-fade-up overflow-hidden rounded-xl border border-border bg-card transition-transform hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={p.img || "/placeholder.svg"}
                  alt={p.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
                <span className="absolute left-2 top-2 flex size-5 items-center justify-center rounded-md bg-card/90 shadow-sm">
                  <Check className="size-3 text-brand" />
                </span>
                <span
                  className={`absolute bottom-2 left-2 rounded-md bg-card/90 px-1.5 py-0.5 text-[9px] font-bold ${snsColor[p.sns] ?? "text-navy"}`}
                >
                  {p.sns}
                </span>
              </div>
              <div className={compact ? "p-2" : "p-2.5"}>
                <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-navy">
                  {p.title}
                </p>
                <p className={compact ? "mt-1 line-clamp-1 text-[10px] leading-snug text-muted-foreground" : "mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground"}>
                  {p.excerpt}
                </p>
                <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                  <span className="truncate rounded bg-secondary px-1.5 py-0.5 font-medium">
                    {p.collection}
                  </span>
                  <span className="shrink-0">{p.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

