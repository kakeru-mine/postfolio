import { BackToPreviousButton } from "@/components/back-to-previous-button";
import { StandaloneLanguageControls } from "@/components/standalone-language-controls";
import { getOptionalCurrentUser } from "@/lib/user";

type Announcement = {
  date: string;
  title: string;
  body: string;
};

// 新しいお知らせは配列の先頭に追加してください（新しい順に表示されます）。
const announcements: Announcement[] = [
  {
    date: "2026年6月30日",
    title: "Postfolioを公開しました",
    body: "SNSで見つけた良い投稿を保存・整理できるリサーチボックス「Postfolio」を公開しました。X / Instagram / Threads / YouTube / note / Substack / TikTok に対応しています。",
  },
];

export default async function AnnouncementsPage() {
  const user = await getOptionalCurrentUser();
  const isLoggedIn = Boolean(user);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex items-center justify-between gap-4">
        <BackToPreviousButton
          fallbackHref={isLoggedIn ? "/" : "/welcome"}
          preferHistory={isLoggedIn}
        />
        <StandaloneLanguageControls />
      </div>
      <h1 className="mt-8 text-3xl font-bold">お知らせ</h1>
      <p className="mt-2 text-sm text-slate-400">
        Postfolioからの最新のお知らせを掲載します。
      </p>

      <div className="mt-8 space-y-4">
        {announcements.length ? (
          announcements.map((announcement) => (
            <article
              key={`${announcement.date}-${announcement.title}`}
              className="card p-6 sm:p-8"
            >
              <time className="text-xs font-bold text-[var(--primary)]">
                {announcement.date}
              </time>
              <h2 className="mt-1 text-lg font-bold">{announcement.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {announcement.body}
              </p>
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
