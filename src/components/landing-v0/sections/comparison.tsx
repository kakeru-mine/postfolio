import { Check, X } from "lucide-react"

const rows = [
  { label: "複数SNSを横断して保存", others: false, postfolio: true },
  { label: "サムネ付きのビジュアル一覧", others: false, postfolio: true },
  { label: "用途別のコレクション分類", others: true, postfolio: true },
  { label: "AIによる要約・評価", others: false, postfolio: true },
  { label: "「再利用するなら？」の提案", others: false, postfolio: true },
  { label: "リサーチメモで自分の資料化", others: false, postfolio: true },
]

export function Comparison() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            Why Postfolio
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            <span className="sm:hidden">
              ブックマークと
              <br />
              何が違う？
            </span>
            <span className="hidden sm:inline">ブックマークと、何が違う？</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            <span className="sm:hidden">
              「貯める」だけのツールと違い、
              <br />
              Postfolioは「活かす」までを
              <br />
              設計しています。
            </span>
            <span className="hidden sm:inline">
              「貯める」だけのツールと違い、Postfolioは「活かす」までを設計しています。
            </span>
          </p>
        </div>

        <div className="lp-fade-up mt-12 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[1.6fr_1fr_1fr]">
            <div className="border-b border-border p-4 text-sm font-semibold text-muted-foreground">
              機能
            </div>
            <div className="border-b border-l border-border p-4 text-center text-sm font-semibold text-muted-foreground">
              一般的な保存
            </div>
            <div className="bg-brand/5 border-b border-l border-border p-4 text-center text-sm font-bold text-brand">
              Postfolio
            </div>

            {rows.map((r, i) => (
              <div key={r.label} className="contents">
                <div
                  className={`p-4 text-sm font-medium text-navy ${
                    i < rows.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  {r.label}
                </div>
                <div
                  className={`flex items-center justify-center border-l border-border p-4 ${
                    i < rows.length - 1 ? "border-b" : ""
                  }`}
                >
                  {r.others ? (
                    <Check className="size-5 text-muted-foreground" />
                  ) : (
                    <X className="size-5 text-border" />
                  )}
                </div>
                <div
                  className={`bg-brand/5 flex items-center justify-center border-l border-border p-4 ${
                    i < rows.length - 1 ? "border-b" : ""
                  }`}
                >
                  <span className="bg-brand-gradient flex size-6 items-center justify-center rounded-full">
                    <Check className="size-3.5 text-brand-foreground" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

