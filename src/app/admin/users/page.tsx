import { notFound } from "next/navigation";
import { AdminUserList } from "@/components/admin-user-list";
import { BackToPreviousButton } from "@/components/back-to-previous-button";
import { isAdminEmail } from "@/lib/admin";
import { getPlanDefinition } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requirePageUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requirePageUser();
  if (!isAdminEmail(user.email)) {
    notFound();
  }

  // Accounts that actually completed registration — via password (passwordHash
  // set) or Google (emailVerifiedAt set). Excludes the unclaimed demo row.
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { passwordHash: { not: null } },
        { emailVerifiedAt: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      plan: true,
      subscriptionStatus: true,
      createdAt: true,
      _count: { select: { savedItems: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const summary = {
    total: users.length,
    verified: users.filter((u) => u.emailVerifiedAt).length,
    paid: users.filter((u) => u.plan !== "FREE").length,
    newThisMonth: users.filter((u) => u.createdAt >= startOfMonth).length,
  };

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    // Google users have no passwordHash; password sign-ups always set one.
    signupMethod: u.passwordHash ? ("password" as const) : ("google" as const),
    verified: Boolean(u.emailVerifiedAt),
    planLabel: getPlanDefinition(u.plan).name,
    isPaid: u.plan !== "FREE",
    subscriptionStatus: u.subscriptionStatus,
    savedItemCount: u._count.savedItems,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <BackToPreviousButton fallbackHref="/" preferHistory />
      <h1 className="mt-8 text-3xl font-bold">登録者一覧</h1>
      <p className="mt-2 text-sm text-slate-400">
        会員登録が完了したユーザーの一覧です。メールアドレス未確認のユーザーも含まれます。
      </p>
      <AdminUserList users={rows} summary={summary} />
    </main>
  );
}
