import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_THEME, getThemeCssVariables, normalizeTheme } from "@/lib/theme";
import { getOptionalCurrentUser } from "@/lib/user";
import "./globals.css";

export const preferredRegion = "hnd1";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
const ogTitle = "Postfolio | SNSリサーチボックス";
const ogDescription =
  "SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。";
// Two share-card designs; one is picked at random per request so shares vary
// between the brand logo and the research-card mock.
const OG_IMAGES = ["/og-image.png", "/og-mock.png"];

export function generateMetadata(): Metadata {
  const ogImage = OG_IMAGES[Math.floor(Math.random() * OG_IMAGES.length)];
  return {
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Postfolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

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

  return (
    <html lang="ja" style={themeVariables}>
      <body>
        <AppShell
          user={
            user
              ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl }
              : null
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
