import { PostfolioLogo } from "@/components/landing-v0/postfolio-logo"

const groups = [
  {
    title: "プロダクト",
    links: [
      { label: "postfolioの特徴", href: "#features" },
      { label: "投稿を再利用", href: "#reuse" },
      { label: "活用例", href: "#usecase" },
      { label: "料金", href: "#pricing" },
    ],
  },
  {
    title: "サポート",
    links: [
      { label: "FAQ", href: "#faq" },
      { label: "お問い合わせ", href: "/contact" },
    ],
  },
  {
    title: "規約",
    links: [
      { label: "利用規約", href: "/terms" },
      { label: "プライバシー", href: "/privacy" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer
      className="border-t border-white/10 text-white"
      style={{
        background:
          "linear-gradient(110deg, var(--sidebar), color-mix(in srgb, var(--primary-end) 32%, var(--sidebar)))",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <PostfolioLogo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              保存したSNS投稿を
              <br />
              次の企画に使える形で整理する。
              <br />
              クリエイターのためのSNSリサーチボックス。
            </p>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="text-sm font-semibold text-white">{g.title}</h3>
              <ul className="mt-3 space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="text-sm text-white/68 transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/60">© 2026 Postfolio. All rights reserved.</p>
          <p className="text-xs text-white/60">SNS Research Box</p>
        </div>
      </div>
    </footer>
  )
}

