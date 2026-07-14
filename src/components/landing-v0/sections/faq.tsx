"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

const faqs = [
  {
    q: "どのSNSに対応していますか？",
    a: "X / Instagram / Threads / YouTube / note / Substack / TikTok / Reddit など、主要なSNSに対応しています。投稿のURLを貼るだけで、本文や画像などをまとめて保存できます。",
  },
  {
    q: "AI分析では何がわかりますか？",
    a: "保存した投稿の「概要」「投稿の評価」「コンテンツの切り口」、そして「再利用するなら？」という具体的な活用アイデアを提案します。なお、AIの回答は参考資料としてご活用ください。",
  },
  {
    q: "無料プランでもAI分析は使えますか？",
    a: "はい。Freeプランでも1日1件までAI分析をお試しいただけます。より多く分析したい場合は、ProやCreatorプランをご利用ください。",
  },
  {
    q: "保存した投稿はどう整理できますか？",
    a: "コレクション（フォルダ）とタグで用途やテーマごとに分類できます。キーワード検索やSNS種別フィルターと組み合わせれば、目的の投稿に素早くたどり着けます。",
  },
  {
    q: "プランはいつでも変更できますか？",
    a: "はい。アップグレード・ダウングレードはいつでも可能です。有料プランは契約期間の終了時にFreeへ切り替えることもできます。",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 bg-white px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">FAQ</p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          よくある質問
        </h2>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div
              key={f.q}
              className="lp-fade-up overflow-hidden rounded-xl border border-border bg-card"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-navy">{f.q}</span>
                <span className="bg-secondary flex size-7 shrink-0 items-center justify-center rounded-full">
                  {isOpen ? (
                    <Minus className="size-4 text-navy" />
                  ) : (
                    <Plus className="size-4 text-navy" />
                  )}
                </span>
              </button>
              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

