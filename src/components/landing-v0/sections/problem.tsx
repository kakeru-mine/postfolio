import { Bookmark, Search, Hourglass } from "lucide-react"

const problems = [
  {
    icon: Bookmark,
    title: "保存しただけで終わる",
    body: "各SNSの「いいね」「保存」に散らばったまま。あとで見返すことはほとんどなく、ただ眠っている。",
  },
  {
    icon: Search,
    title: "あの投稿が見つからない",
    body: "「参考にしたいあれ、どこだっけ？」SNSをまたいだ検索は手間で、見つける頃には熱量も冷めている。",
  },
  {
    icon: Hourglass,
    title: "企画に活かせていない",
    body: "良いと思った理由も、どう自分の発信に使うかも、記録していない。インプットが資産になっていない。",
  },
]

export function Problem() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">The Problem</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl lg:whitespace-nowrap">
            <span className="sm:hidden">
              「保存」が
              <br />
              ただの墓場に
              <br />
              なっていませんか？
            </span>
            <span className="hidden sm:inline">「保存」が、ただの墓場になっていませんか？</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            <span className="sm:hidden">
              発信を続けるクリエイターほど、
              <br />
              毎日たくさんの投稿に出会う。
              <br />
              <br />
              でも、その出会いを次の一手に
              <br />
              つなげる仕組みがない。
            </span>
            <span className="hidden sm:inline">
              発信を続けるクリエイターほど、毎日たくさんの投稿に出会う。
              <br />
              でも、その出会いを次の一手につなげる仕組みがない。
            </span>
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {problems.map((p, i) => (
            <div
              key={p.title}
              className="lp-fade-up rounded-2xl border border-border bg-card p-6 shadow-sm"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-secondary">
                <p.icon className="size-5 text-navy" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-navy">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
