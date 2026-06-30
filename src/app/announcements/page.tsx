import { BackToPreviousButton } from "@/components/back-to-previous-button";
import {
  MarkAllReadButton,
  MarkReadButton,
} from "@/components/announcement-read-controls";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";
import { listAnnouncementsForUser } from "@/lib/announcements";
import { getOptionalCurrentUser } from "@/lib/user";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// Turn bare http(s) URLs in the body into clickable links. The text itself is
// rendered by React (escaped), so this stays XSS-safe.
function renderBody(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-[var(--primary)] underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export default async function AnnouncementsPage() {
  const user = await getOptionalCurrentUser();
  const isLoggedIn = Boolean(user);
  const announcements = await listAnnouncementsForUser(
    user?.id ?? null,
    user?.createdAt ?? null,
  );
  const hasUnread = announcements.some((announcement) => !announcement.read);

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
                  {formatDate(announcement.publishedAt)}
                </time>
                {isLoggedIn && !announcement.read ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
                    未読
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1 text-lg font-bold">{announcement.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {renderBody(announcement.body)}
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
    </main>
  );
}
