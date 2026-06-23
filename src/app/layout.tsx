import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_THEME, getThemeCssVariables } from "@/lib/theme";
import { getOptionalCurrentUser } from "@/lib/user";
import { getUserTheme } from "@/lib/user-theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postfolio | SNSリサーチボックス",
  description: "SNSで見つけた良い投稿を、次の企画につなげるリサーチ資産へ。",
  icons: {
    icon: "/postfolio-icon.png",
    apple: "/postfolio-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getOptionalCurrentUser();
  const theme = user ? await getUserTheme(user.id) : DEFAULT_THEME;
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
