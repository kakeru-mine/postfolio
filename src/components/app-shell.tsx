"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Archive,
  CircleDollarSign,
  Home,
  Layers3,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { LegalReturnLink } from "@/components/legal-return-link";
import { LogoutButton } from "@/components/logout-button";
import {
  LanguageSwitcher,
  type AppLanguage,
} from "@/components/language-switcher";
import { LanguageDomTranslator } from "@/components/language-dom-translator";
import { APP_VERSION } from "@/lib/version";

const labels = {
  ja: {
    home: "ホーム",
    items: "保存アイテム",
    collections: "コレクション",
    pricing: "プラン一覧",
    manual: "マニュアル",
    settings: "設定",
    news: "お知らせ",
    newsAdmin: "お知らせ管理",
    users: "登録者一覧",
    terms: "利用規約",
    privacy: "プライバシー",
    contact: "お問い合わせ",
    logout: "ログアウト",
    loggingOut: "ログアウト中...",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
    mainMenu: "メインメニュー",
    mobileMenu: "スマートフォンメニュー",
    unread: "未読のお知らせがあります",
  },
  en: {
    home: "Home",
    items: "Saved Items",
    collections: "Collections",
    pricing: "Plans",
    manual: "Manual",
    settings: "Settings",
    news: "News",
    newsAdmin: "Manage news",
    users: "Registered users",
    terms: "Terms",
    privacy: "Privacy",
    contact: "Contact",
    logout: "Log out",
    loggingOut: "Logging out...",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    mainMenu: "Main menu",
    mobileMenu: "Mobile menu",
    unread: "You have unread announcements",
  },
} as const;

export function AppShell({
  children,
  user,
  hasUnreadAnnouncements = false,
  isAdmin = false,
}: {
  children: React.ReactNode;
  user: { name: string | null; email: string; avatarUrl: string | null } | null;
  hasUnreadAnnouncements?: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // The authenticated app supports Japanese and English. Chrome (this shell) is
  // switched via `labels[language]`; the page content inside <main> is handled
  // by the DOM translator mounted below.
  const [language, setLanguage] = useState<AppLanguage>("ja");

  useEffect(() => {
    const saved = window.localStorage.getItem("postfolio-language");
    if (saved === "ja" || saved === "en") {
      // An explicit past choice always wins.
      setLanguage(saved);
      document.documentElement.lang = saved;
      return;
    }
    // First visit: default to the browser locale. Japanese browsers start in
    // Japanese, everything else in English. Not persisted until the user picks.
    const detected = (navigator.language || "").toLowerCase().startsWith("ja")
      ? "ja"
      : "en";
    setLanguage(detected);
    document.documentElement.lang = detected;
  }, []);

  function changeLanguage(next: AppLanguage) {
    setLanguage(next);
    window.localStorage.setItem("postfolio-language", next);
    document.documentElement.lang = next;
  }

  const t = labels[language];

  if (
    // The root path renders the marketing LP for signed-out visitors, which
    // brings its own header/footer — so it must not be wrapped in the app shell.
    (pathname === "/" && !user) ||
    pathname === "/welcome" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email" ||
    pathname === "/announcements" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/commercial-transactions" ||
    pathname === "/contact"
  ) {
    return children;
  }

  const navigation = [
    {
      href: "/",
      icon: <Home size={17} />,
      label: t.home,
      active: pathname === "/",
    },
    {
      href: "/items",
      icon: <Archive size={17} />,
      label: t.items,
      active: pathname.startsWith("/items"),
    },
    {
      href: "/collections",
      icon: <Layers3 size={17} />,
      label: t.collections,
      active: pathname.startsWith("/collections"),
    },
    {
      href: "/pricing",
      icon: <CircleDollarSign size={17} />,
      label: t.pricing,
      active: pathname.startsWith("/pricing"),
    },
    {
      href: "/settings",
      icon: <Settings size={17} />,
      label: t.settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="min-h-screen">
      <LanguageDomTranslator language={language} />
      <div className="sticky top-0 z-40 shadow-sm">
        <header
          className="border-b border-white/10 text-[var(--sidebar-foreground)]"
          style={{
            background:
              "linear-gradient(110deg, var(--sidebar), color-mix(in srgb, var(--primary-end) 32%, var(--sidebar)))",
          }}
        >
          <div className="flex w-full flex-wrap items-center gap-x-7 gap-y-3 px-5 py-4 sm:px-8 lg:px-10 lg:py-5">
            <div className="flex shrink-0 items-center gap-3.5 text-xl font-bold sm:hidden">
              <Image
                src="/postfolio-icon.png"
                alt="Postfolio"
                width={46}
                height={46}
                className="rounded-xl"
                priority
              />
              <span>
                Postfolio
                <span className="ml-2 hidden text-sm font-normal opacity-60 sm:inline">
                  SNS Research Box
                </span>
              </span>
            </div>

            <Link
              href="/"
              className="hidden shrink-0 items-center gap-3.5 text-xl font-bold sm:flex"
            >
              <Image
                src="/postfolio-icon.png"
                alt="Postfolio"
                width={46}
                height={46}
                className="rounded-xl"
                priority
              />
              <span>
                Postfolio
                <span className="ml-2 hidden text-sm font-normal opacity-60 sm:inline">
                  SNS Research Box
                </span>
                <span className="ml-2 align-top text-[10px] font-normal opacity-55">
                  {APP_VERSION}
                </span>
              </span>
            </Link>

            <button
              type="button"
              aria-label={menuOpen ? t.closeMenu : t.openMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="relative ml-auto grid size-11 place-items-center rounded-xl border border-white/15 bg-white/10 transition hover:bg-white/15 sm:hidden"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
              {hasUnreadAnnouncements && !menuOpen ? (
                <span
                  role="img"
                  aria-label={t.unread}
                  className="absolute right-2 top-2 size-2.5 rounded-full bg-red-500 ring-2 ring-[var(--sidebar)]"
                />
              ) : null}
            </button>

            <nav
              aria-label={t.mainMenu}
              className="order-2 hidden justify-start gap-1.5 sm:flex"
            >
              {navigation.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            {menuOpen ? (
              <div
                id="mobile-menu"
                className="order-3 w-full border-t border-white/10 pt-3 sm:hidden"
              >
                <div className="flex flex-wrap gap-5 text-sm opacity-70">
                  <Link
                    href="/announcements"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center gap-1.5"
                  >
                    {t.news}
                    {hasUnreadAnnouncements ? (
                      <span
                        role="img"
                        aria-label={t.unread}
                        className="size-2 rounded-full bg-red-500"
                      />
                    ) : null}
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin/announcements"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t.newsAdmin}
                    </Link>
                  ) : null}
                  {isAdmin ? (
                    <Link
                      href="/admin/users"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t.users}
                    </Link>
                  ) : null}
                  <LegalReturnLink href="/terms" onClick={() => setMenuOpen(false)}>
                    {t.terms}
                  </LegalReturnLink>
                  <LegalReturnLink href="/privacy" onClick={() => setMenuOpen(false)}>
                    {t.privacy}
                  </LegalReturnLink>
                  <Link href="/contact" onClick={() => setMenuOpen(false)}>
                    {t.contact}
                  </Link>
                </div>
                <div className="mt-3">
                  <LanguageSwitcher
                    language={language}
                    onChange={(next) => {
                      changeLanguage(next);
                      setMenuOpen(false);
                    }}
                    variant="floating"
                  />
                </div>
                {user ? (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <p className="mb-2 truncate px-3 text-xs opacity-60">
                      {user.name || user.email}
                    </p>
                    <LogoutButton
                      mobile
                      label={t.logout}
                      loadingLabel={t.loggingOut}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </header>

        <div className="hidden border-b border-slate-100 bg-white/90 px-5 py-2 text-sm text-slate-500 backdrop-blur sm:block sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-end gap-5">
            {isAdmin ? (
              <Link
                href="/admin/announcements"
                className="font-bold text-[var(--primary)] transition hover:opacity-80"
              >
                {t.newsAdmin}
              </Link>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin/users"
                className="font-bold text-[var(--primary)] transition hover:opacity-80"
              >
                {t.users}
              </Link>
            ) : null}
            <Link
              href="/announcements"
              className="inline-flex items-center gap-1.5 transition hover:text-[var(--primary)]"
            >
              {t.news}
              {hasUnreadAnnouncements ? (
                <span
                  role="img"
                  aria-label={t.unread}
                  className="size-2 rounded-full bg-red-500"
                />
              ) : null}
            </Link>
            <LegalReturnLink href="/terms" className="transition hover:text-[var(--primary)]">
              {t.terms}
            </LegalReturnLink>
            <LegalReturnLink href="/privacy" className="transition hover:text-[var(--primary)]">
              {t.privacy}
            </LegalReturnLink>
            <Link href="/contact" className="transition hover:text-[var(--primary)]">
              {t.contact}
            </Link>
            <LanguageSwitcher
              language={language}
              onChange={changeLanguage}
              variant="floating"
            />
            {user ? (
              <LogoutButton label={t.logout} loadingLabel={t.loggingOut} />
            ) : null}
          </div>
        </div>
      </div>

      <main className="min-w-0 pb-24 sm:pb-0">{children}</main>
      <nav
        aria-label={t.mobileMenu}
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/10 px-1.5 py-2 text-[var(--sidebar-foreground)] shadow-[0_-12px_30px_rgba(15,23,42,0.22)] backdrop-blur sm:hidden"
        style={{
          background:
            "linear-gradient(110deg, var(--sidebar), color-mix(in srgb, var(--primary-end) 32%, var(--sidebar)))",
        }}
      >
        {navigation.map((item) => (
          <MobileFooterLink
            key={item.href}
            {...item}
            label={mobileFooterLabel(item.href, item.label)}
          />
        ))}
      </nav>
    </div>
  );
}

function MobileFooterLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-1.5 text-[9px] font-bold transition ${
        active
          ? "bg-white/18 text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="grid size-5 place-items-center">{icon}</span>
      <span className="max-w-full truncate leading-none">{label}</span>
    </Link>
  );
}

function mobileFooterLabel(href: string, fallback: string) {
  switch (href) {
    case "/":
      return "ホーム";
    case "/items":
      return "保存アイテム";
    case "/collections":
      return "コレクション";
    case "/pricing":
      return "プラン";
    case "/settings":
      return "設定";
    default:
      return fallback;
  }
}

function NavLink({
  href,
  icon,
  label,
  active,
  mobile = false,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-base font-bold transition ${
        mobile ? "w-full" : ""
      } ${
        active
          ? "bg-white/18 opacity-100"
          : "opacity-75 hover:bg-white/10 hover:opacity-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
