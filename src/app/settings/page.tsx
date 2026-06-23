import { AccountDeleteSection } from "@/components/account-delete-section";
import { CheckoutSync } from "@/components/checkout-sync";
import { PageHeader } from "@/components/page-header";
import { ThemeSettings } from "@/components/theme-settings";
import { requirePageUser } from "@/lib/user";
import { getUserTheme } from "@/lib/user-theme";

type SearchParams = Promise<{ checkout?: string; session_id?: string }>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePageUser();
  const theme = await getUserTheme(user.id);
  const params = await searchParams;
  const hasActivePaidSubscription =
    user.plan !== "FREE" && Boolean(user.stripeSubscriptionId);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <PageHeader
        eyebrow="Settings"
        title="設定"
        description="カラー設定を変更できます。"
      />

      {params.checkout === "success" && params.session_id ? (
        <CheckoutSync sessionId={params.session_id} />
      ) : params.checkout === "success" ? (
        <p className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          お申し込みを受け付けました。Stripeからの通知後、プランが反映されます。
        </p>
      ) : null}

      <ThemeSettings initialTheme={theme} />
      <AccountDeleteSection
        hasActivePaidSubscription={hasActivePaidSubscription}
      />
    </div>
  );
}
