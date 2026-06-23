import { Sparkles, TrendingUp, Lightbulb, RefreshCw } from "lucide-react"

const reuseIdeas = [
  "創作小説の冒頭例として「読者を一瞬で引き込む書き出し」の見本に使う",
  "“しゃべる道具”の設定素材として、AIに続きの展開案を出させる下地に使う",
  "和風ファンタジー作品の告知文や紹介カードの本文抜粋に流用する",
  "画像とタイトル文字の合わせ方を分析し、自分の投稿サムネに再現する",
]

export function AiAnalysisMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-brand/10">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-gradient flex size-9 items-center justify-center rounded-lg">
            <Sparkles className="size-4 text-brand-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-navy">AI分析</p>
            <p className="text-[11px] text-muted-foreground">投稿内容をAIが分析します</p>
          </div>
        </div>
        <div className="bg-coral-gradient flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-coral-foreground">
          <RefreshCw className="size-3" />
          再分析
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* rating */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4">
          <div className="bg-brand-gradient flex size-16 shrink-0 items-center justify-center rounded-xl shadow-md">
            <span className="text-3xl font-bold text-brand-foreground">A</span>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              AI Rating
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <TrendingUp className="size-4 text-brand" />
              <p className="text-sm font-bold text-navy">投稿の評価</p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              冒頭の掴みが強く、一行でファンタジー要素と不穏さを同時提示。雰囲気づくりに成功しています。
            </p>
          </div>
        </div>

        {/* summary */}
        <div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-brand" />
            <p className="text-sm font-bold text-navy">投稿概要</p>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            引っ越し先の部屋で、主人公が“しゃべる鏡”に遭遇する冒頭シーン。会話の違和感と不穏さで物語への引き込みがあり、画像も作品世界を補強している。
          </p>
        </div>

        {/* reuse ideas */}
        <div className="rounded-xl bg-brand/5 p-4">
          <div className="flex items-center gap-1.5">
            <Lightbulb className="size-4 text-brand" />
            <p className="text-sm font-bold text-navy">再利用するなら？</p>
          </div>
          <ul className="mt-2.5 space-y-2">
            {reuseIdeas.map((idea) => (
              <li key={idea} className="flex gap-2 text-xs leading-relaxed text-navy">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

