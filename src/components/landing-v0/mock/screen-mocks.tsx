import Image from "next/image"
import { ExternalLink, Folder, Check } from "lucide-react"

/* 投稿詳細モック */
export function PostDetailMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div className="relative aspect-[16/10]">
        <Image src="/landing/mock/post-1.png" alt="保存した投稿のプレビュー" fill sizes="400px" className="object-cover" />
        <span className="absolute bottom-3 left-3 rounded-md bg-card/90 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
          note
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
            リサーチメモ
          </p>
          <span className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground">
            元の投稿 <ExternalLink className="size-2.5" />
          </span>
        </div>
        <h4 className="mt-2 text-sm font-bold leading-snug text-navy">
          夜の部屋で出会う、しゃべる鏡の話
        </h4>
        <div className="mt-3 rounded-lg border border-border bg-surface p-2.5">
          <p className="text-[10px] text-muted-foreground">自分のメモ</p>
          <p className="mt-1 text-[11px] leading-relaxed text-navy">
            冒頭1行の掴みが秀逸。自分の連載の導入にも“違和感”を入れてみる。
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["創作の参考", "冒頭", "世界観"].map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* コレクションモック */
const collections = [
  { name: "コンテンツ企画", count: 12, active: true },
  { name: "ビジュアル研究", count: 8, active: false },
  { name: "ライティング", count: 5, active: false },
  { name: "ブランディング", count: 3, active: false },
]

export function CollectionMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
        Organize your sources
      </p>
      <h4 className="mt-1 text-sm font-bold text-navy">コレクション</h4>
      <p className="mt-0.5 text-[11px] text-muted-foreground">用途やテーマごとに分類</p>

      <div className="mt-3 space-y-2">
        {collections.map((c) => (
          <div
            key={c.name}
            className={`flex items-center justify-between rounded-lg border p-2.5 ${
              c.active ? "border-brand/30 bg-brand/5" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`flex size-7 items-center justify-center rounded-lg ${
                  c.active ? "bg-brand-gradient" : "bg-secondary"
                }`}
              >
                <Folder className={`size-3.5 ${c.active ? "text-brand-foreground" : "text-navy"}`} />
              </span>
              <span className="text-xs font-semibold text-navy">{c.name}</span>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{c.count}件</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* プランモック */
const plans = [
  { name: "Free", price: "¥0", popular: false },
  { name: "Pro", price: "¥500", popular: true },
  { name: "Creator", price: "¥980", popular: false },
]

export function PlanMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-lg">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
        Simple monthly plans
      </p>
      <h4 className="mt-1 text-sm font-bold text-navy">プラン一覧</h4>
      <div className="mt-3 space-y-2">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`flex items-center justify-between rounded-lg border p-3 ${
              p.popular ? "border-brand/40 bg-brand/5" : "border-border bg-surface"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy">{p.name}</span>
              {p.popular && (
                <span className="bg-brand rounded-full px-2 py-0.5 text-[9px] font-semibold text-brand-foreground">
                  おすすめ
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-navy">{p.price}</span>
              {p.name !== "Free" && <span className="text-[9px] text-muted-foreground">/月</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-surface p-2.5">
        <Check className="size-3.5 text-brand" />
        <span className="text-[10px] text-muted-foreground">保存枠とAI分析回数がプランで拡張</span>
      </div>
    </div>
  )
}

