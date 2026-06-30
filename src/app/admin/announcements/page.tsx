import { notFound } from "next/navigation";
import { AnnouncementAdmin } from "@/components/announcement-admin";
import { BackToPreviousButton } from "@/components/back-to-previous-button";
import { isAdminEmail } from "@/lib/admin";
import { listAllAnnouncements } from "@/lib/announcements";
import { requirePageUser } from "@/lib/user";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const user = await requirePageUser();
  if (!isAdminEmail(user.email)) {
    notFound();
  }

  const announcements = await listAllAnnouncements();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <BackToPreviousButton fallbackHref="/" preferHistory />
      <h1 className="mt-8 text-3xl font-bold">お知らせ管理</h1>
      <p className="mt-2 text-sm text-slate-400">
        お知らせの投稿・編集・削除ができます。投稿すると全ユーザーに未読として通知されます。
      </p>
      <div className="mt-8">
        <AnnouncementAdmin initialAnnouncements={announcements} />
      </div>
    </main>
  );
}
