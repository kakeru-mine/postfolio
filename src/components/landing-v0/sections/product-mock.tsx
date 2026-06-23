import { PostDetailMock, CollectionMock, PlanMock } from "@/components/landing-v0/mock/screen-mocks"

const items = [
  {
    label: "投稿詳細",
    desc: "本文・画像・メタ情報に、自分のメモとタグを添えて資料化。",
    mock: <PostDetailMock />,
  },
  {
    label: "コレクション",
    desc: "テーマごとに分類して、用途別の資料棚をつくる。",
    mock: <CollectionMock />,
  },
  {
    label: "プラン",
    desc: "無料から。使うほど保存枠とAI分析が広がる。",
    mock: <PlanMock />,
  },
]

export function ProductMock() {
  return (
    <section className="bg-[linear-gradient(135deg,#e0f2fe_0%,#eef2ff_48%,#faf5ff_100%)]">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Inside Postfolio
        </p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          隅々まで、心地よく使える
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          <span className="sm:hidden">
            保存から分類、料金まで。
            <br />
            一貫した美しいUIで、
            <br />
            リサーチがはかどります。
          </span>
          <span className="hidden sm:inline">
            保存から分類、料金まで。一貫した美しいUIで、リサーチがはかどります。
          </span>
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {items.map((it, i) => (
          <div key={it.label} className="lp-fade-up flex flex-col" style={{ animationDelay: `${i * 120}ms` }}>
            <div className="order-1 mb-4 px-1 md:order-2 md:mb-0 md:mt-4">
              <h3 className="text-base font-bold text-navy">{it.label}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
            <div className="order-2 md:order-1">{it.mock}</div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}

