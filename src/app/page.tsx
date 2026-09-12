import type { ReactNode } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  CreditCard,
  FolderKanban,
  Library,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { AvatarUploader } from "@/components/avatar-uploader";
import { ItemCard } from "@/components/item-card";
import { LandingV0Page } from "@/components/landing-v0/landing-page";
import { ManualHelpButton } from "@/components/manual-help-button";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { OnboardingWelcome } from "@/components/onboarding-welcome";
import { PageHeader } from "@/components/page-header";
import { UsageMeter } from "@/components/usage-meter";
import { prisma } from "@/lib/prisma";
import { getUsageSummary } from "@/lib/usage";
import { getOptionalCurrentUser } from "@/lib/user";

export default async function Home() {
  const user = await getOptionalCurrentUser();
  // Signed-out visitors to the bare domain see the marketing LP (good for SEO
  // and first impression) instead of being bounced to /login.
  if (!user) {
    return <LandingV0Page isLoggedIn={false} />;
  }
  const [usage, recentItems, collectionCount] = await Promise.all([
    getUsageSummary(user),
    prisma.savedItem.findMany({
      where: { userId: user.id },
      include: { collection: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.collection.count({ where: { userId: user.id } }),
  ]);
  const hasPaidPlan = user.plan !== "FREE";
  const aiUsageLabel =
    usage.plan.aiLimitPeriod === "day" ? "今日のAI分析" : "今月のAI分析";
  const aiUsageResetText =
    usage.plan.aiLimitPeriod === "day"
      ? "FreeプランのAI分析は毎日リセットされます。"
      : "AI分析は毎月1日にリセットされます。";

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <OnboardingWelcome seen={Boolean(user.onboardingSeenAt)} />
      <PageHeader eyebrow="Dashboard" title="ホーム" />

      <OnboardingChecklist
        savedDone={usage.savedItemCount > 0}
        analyzeDone={usage.aiAnalysisCount > 0}
        collectionDone={collectionCount > 0}
      />

      <section className="mt-8 card p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <div className="max-w-5xl">
            <p className="text-sm font-bold text-[var(--primary)]">
              ようこそPostfolioへ
            </p>
            <h2 className="mt-2 text-xl font-bold leading-snug sm:text-3xl">
              保存したSNS投稿を、次の企画に使える形で整理しましょう。
            </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:max-w-3xl">
            <QuickLink
              href="/items"
              icon={<Library size={18} />}
              title="保存アイテム"
              description="投稿一覧を見る"
            />
            <QuickLink
              href="/collections"
              icon={<FolderKanban size={18} />}
              title="コレクション"
              description="分類を整理する"
            />
          </div>
        </div>
      </section>

      <section className="mt-8 sm:hidden">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--primary)]">Recent</p>
            <h2 className="mt-1 text-xl font-bold">最近の投稿</h2>
          </div>
          <Link
            href="/items"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]"
          >
            すべて見る
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentItems.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {recentItems.slice(0, 2).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="card mt-5 grid min-h-48 place-items-center p-6 text-center">
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary-dark)]">
                <Plus size={24} />
              </div>
              <h3 className="mt-4 text-base font-bold">
                まだ保存した投稿がありません
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                最初のURLを保存すると、ここに最近の投稿が表示されます。
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-6">
        <section className="card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <AvatarUploader
              initialAvatarUrl={user.avatarUrl}
              label={user.name || user.email}
            />
            <div>
              <h2 className="font-bold">アカウント</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <ManualHelpButton topics={["plan"]} label="プランについて" />
        </div>
          <dl className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm sm:mt-6 sm:space-y-4 sm:pt-5">
            <Row label="表示名" value={user.name || "未設定"} />
            <Row label="現在のプラン" value={usage.plan.name} />
            {hasPaidPlan ? (
              <Row
                label="お支払い状況"
                value={
                  user.subscriptionCancelAtPeriodEnd
                    ? "期間終了時に解約予定"
                    : subscriptionStatusLabel(user.subscriptionStatus)
                }
              />
            ) : null}
            {hasPaidPlan && user.subscriptionPeriodEnd ? (
              <Row
                label={
                  user.subscriptionCancelAtPeriodEnd
                    ? "利用終了予定日"
                    : "次回更新日"
                }
                value={format(user.subscriptionPeriodEnd, "yyyy/MM/dd")}
              />
            ) : null}
          </dl>
        </section>

        <section className="card p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary-dark)] sm:size-10">
              <CreditCard size={19} />
            </span>
            <div>
              <h2 className="font-bold">利用状況</h2>
              <p className="text-sm text-slate-500">
                {aiUsageResetText}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 sm:mt-6 sm:space-y-6 sm:pt-5">
            <UsageMeter
              label="保存枠"
              value={usage.savedItemCount}
              limit={usage.plan.savedItemLimit}
              unit="件"
            />
            <UsageMeter
              label={aiUsageLabel}
              value={usage.aiAnalysisCount}
              limit={usage.plan.monthlyAiLimit}
              unit="件"
              unlimited={usage.plan.aiAnalysisUnlimited}
            />
          </div>
        </section>
      </section>

      <section className="mt-8 hidden sm:block">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--primary)]">Recent</p>
            <h2 className="mt-1 text-xl font-bold">最近の投稿</h2>
          </div>
          <Link
            href="/items"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)]"
          >
            すべて見る
            <ArrowRight size={16} />
          </Link>
        </div>

        {recentItems.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {recentItems.map((item, index) => (
              <div key={item.id} className={index > 1 ? "hidden sm:block" : ""}>
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card mt-5 grid min-h-64 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary-dark)]">
                <Plus size={26} />
              </div>
              <h3 className="mt-4 text-lg font-bold">
                まだ保存した投稿がありません
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                最初のURLを保存すると、ここに最近の投稿が表示されます。
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md sm:p-4"
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] sm:size-9">
        {icon}
      </span>
      <span className="mt-3 block text-sm font-bold text-[var(--ink)] group-hover:text-[var(--primary)] sm:text-base">
        {title}
      </span>
      <span className="mt-1 block text-xs text-slate-500">{description}</span>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function subscriptionStatusLabel(status: string | null) {
  switch (status) {
    case "active":
      return "契約中";
    case "trialing":
      return "無料期間中";
    case "past_due":
      return "支払い遅延";
    case "unpaid":
      return "未払い";
    case "incomplete":
    case "incomplete_expired":
      return "支払い手続き未完了";
    case "paused":
      return "一時停止中";
    case "canceled":
      return "解約済み";
    default:
      return "確認が必要";
  }
}
