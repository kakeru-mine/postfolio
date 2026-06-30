import Link from "next/link";
import { BackToPreviousButton } from "@/components/back-to-previous-button";
import {
  MarkAllReadButton,
  MarkReadButton,
} from "@/components/announcement-read-controls";
import {
  TranslatableBody,
  TranslatableTitle,
} from "@/components/announcement-translatable";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";
import {
  ANNOUNCEMENTS_PAGE_SIZE,
  hasUnreadAnnouncements,
  listAnnouncementsForUser,
} from "@/lib/announcements";
import { getOptionalCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateEn(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getOptionalCurrentUser();
  const isLoggedIn = Boolean(user);
  const { page: pageParam } = await searchParams;

  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const { items: announcements, total } = await listAnnouncementsForUser(
    user?.id ?? null,
    user?.createdAt ?? null,
    requestedPage,
  );
  const totalPages = Math.max(1, Math.ceil(total / ANNOUNCEMENTS_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  // The "mark all" button reflects unread across every page, not just this one.
  const hasUnread = user
    ? await hasUnreadAnnouncements(user.id, user.createdAt)
    : false;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <BackToPreviousButton
          fallbackHref={isLoggedIn ? "/" : "/welcome"}
          preferHistory={isLoggedIn}
        />
        <StandaloneLanguageControls />
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">お知らせ</h1>
          <p className="mt-2 text-sm text-slate-400">
            Postfolioからの最新のお知らせを掲載します。
          </p>
        </div>
        {isLoggedIn && hasUnread ? <MarkAllReadButton /> : null}
      </div>

      <div className="mt-8 space-y-4">
        {announcements.length ? (
          announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="card p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-2">
                <time className="text-xs font-bold text-[var(--primary)]">
                  <TranslatableTitle
                    ja={formatDate(announcement.publishedAt)}
                    en={formatDateEn(announcement.publishedAt)}
                  />
                </time>
                {isLoggedIn && !announcement.read ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                    未読
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 text-lg font-bold">
                <TranslatableTitle
                  ja={announcement.title}
                  en={announcement.titleEn}
                />
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                <TranslatableBody
                  ja={announcement.body}
                  en={announcement.bodyEn}
                />
              </p>
              {isLoggedIn && !announcement.read ? (
                <div className="mt-4">
                  <MarkReadButton announcementId={announcement.id} />
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="card p-6 text-sm text-slate-500 sm:p-8">
            現在お知らせはありません。
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav
          className="mt-8 flex items-center justify-center gap-4 text-sm"
          aria-label="ページネーション"
        >
          {page > 1 ? (
            <Link
              href={`/announcements?page=${page - 1}`}
              className="button-secondary px-3 py-1.5"
            >
              <TranslatableTitle ja="前へ" en="Previous" />
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-slate-300">
              <TranslatableTitle ja="前へ" en="Previous" />
            </span>
          )}
          <span className="font-bold text-slate-500">
            <TranslatableTitle
              ja={`${page} / ${totalPages} ページ`}
              en={`Page ${page} of ${totalPages}`}
            />
          </span>
          {page < totalPages ? (
            <Link
              href={`/announcements?page=${page + 1}`}
              className="button-secondary px-3 py-1.5"
            >
              <TranslatableTitle ja="次へ" en="Next" />
            </Link>
          ) : (
            <span className="px-3 py-1.5 text-slate-300">
              <TranslatableTitle ja="次へ" en="Next" />
            </span>
          )}
        </nav>
      ) : null}
    </main>
  );
}
