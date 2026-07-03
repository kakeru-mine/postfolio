import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app-shell";
import { isAdminEmail } from "@/lib/admin";
import { hasUnreadAnnouncements as checkUnreadAnnouncements } from "@/lib/announcements";
import { DEFAULT_THEME, getThemeCssVariables, normalizeTheme } from "@/lib/theme";
import { getOptionalCurrentUser } from "@/lib/user";
import "./globals.css";

export const preferredRegion = "hnd1";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
const ogTitle = "Postfolio | SNSリサーチボックス";
const ogDescription =
  "SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。";
// Default share card. The /welcome page picks a specific variant per share URL
// (see its generateMetadata); a stable image is required because crawlers like X
// re-fetch the page and a non-deterministic og:image breaks card generation.
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: ogTitle,
  description: ogDescription,
  icons: {
    icon: "/postfolio-icon.png",
    apple: "/postfolio-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Postfolio",
    title: ogTitle,
    description: ogDescription,
    locale: "ja_JP",
    images: [{ url: "/og-1.png?v=8", width: 1200, height: 630, alt: "Postfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: ogTitle,
    description: ogDescription,
    images: ["/og-1.png?v=8"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getOptionalCurrentUser();
  const theme = user
    ? normalizeTheme({
        background: user.themeBackground,
        main: user.themeMain,
        accent: user.themeAccent,
        sidebar: user.themeSidebar,
      })
    : DEFAULT_THEME;
  const themeVariables = getThemeCssVariables(theme) as CSSProperties;
  const hasUnreadAnnouncements = user
    ? await checkUnreadAnnouncements(user.id, user.createdAt)
    : false;
  const isAdmin = isAdminEmail(user?.email);

  return (
    <html lang="ja" style={themeVariables}>
      <body>
        <AppShell
          user={
            user
              ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl }
              : null
          }
          hasUnreadAnnouncements={hasUnreadAnnouncements}
          isAdmin={isAdmin}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
