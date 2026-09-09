import { AccountDeleteSection } from "@/components/account-delete-section";
import { PageHeader } from "@/components/page-header";
import { ThemeSettings } from "@/components/theme-settings";
import { requirePageUser } from "@/lib/user";
import { getUserTheme } from "@/lib/user-theme";

export default async function SettingsPage() {
  const user = await requirePageUser();
  const theme = await getUserTheme(user.id);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader
        eyebrow="App Settings"
        title="設定"
        description="カラー設定を変更できます。"
      />

      <ThemeSettings initialTheme={theme} />
      <AccountDeleteSection />
    </div>
  );
}
