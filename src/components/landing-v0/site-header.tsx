"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { PostfolioLogo } from "@/components/landing-v0/postfolio-logo"

const navItems = [
  { label: "postfolioの特徴", href: "#features" },
  { label: "投稿を再利用", href: "#reuse" },
  { label: "活用例", href: "#usecase" },
  { label: "料金", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
]

export function SiteHeader({ primaryHref }: { primaryHref: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 text-white shadow-sm"
      style={{
        background:
          "linear-gradient(110deg, var(--sidebar), color-mix(in srgb, var(--primary-end) 32%, var(--sidebar)))",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <PostfolioLogo />

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-white/78 transition-colors hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
          >
            ログイン
          </a>
          <a
            href={primaryHref}
            className="bg-coral-gradient rounded-full px-5 py-2.5 text-sm font-semibold text-coral-foreground shadow-sm transition-transform hover:scale-[1.03]"
          >
            無料で始める
          </a>
        </div>

        <a
          href="/login"
          className="ml-auto rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 md:hidden"
        >
          ログイン
        </a>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white md:hidden"
          aria-label="メニューを開閉"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 border-t border-white/10 bg-[color-mix(in_srgb,var(--sidebar)_86%,transparent)] px-5 py-4 shadow-2xl backdrop-blur-xl md:hidden">
          <nav className="mx-auto flex max-w-sm flex-col gap-1 rounded-2xl border border-white/10 bg-white/8 p-3">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

