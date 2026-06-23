import { SavedItem, Collection } from "@prisma/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ArrowUpRight, Folder } from "lucide-react";
import Link from "next/link";
import { platformLabel } from "@/lib/platform";

type ItemWithCollection = SavedItem & { collection: Collection | null };

export function ItemCard({
  item,
  variant = "default",
}: {
  item: ItemWithCollection;
  variant?: "default" | "dewey";
}) {
  if (variant === "dewey") {
    return (
      <Link
        href={`/items/${item.id}`}
        className="group block h-full overflow-hidden rounded-[1.7rem] border border-[var(--line)] bg-white shadow-[0_18px_45px_rgba(17,24,39,0.07)] transition duration-200 hover:-translate-y-1 hover:border-[var(--action)]/45 hover:shadow-[0_24px_65px_rgba(17,24,39,0.13)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 via-[#f8f7fb] to-[#eef3ff] sm:aspect-[16/10]">
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="grid h-full place-items-center text-4xl font-black text-[var(--primary)] opacity-20">
              {platformLabel(item.sourcePlatform)}
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/92 px-3 py-1 text-[11px] font-black text-[var(--primary)] shadow-sm backdrop-blur">
            {platformLabel(item.sourcePlatform)}
          </span>
        </div>

        <div className="flex min-h-[13rem] flex-col p-4 sm:p-5">
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(item.userTags)].slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-500"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mt-3 line-clamp-2 text-base font-black leading-6 tracking-tight text-[var(--ink)] sm:text-lg sm:leading-7">
            {item.title || item.domain || item.url}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
            {item.userMemo || item.description || "あとで使える参考投稿として保存されています。"}
          </p>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-stone-100 pt-4 text-xs text-stone-400">
            <span className="flex min-w-0 items-center gap-1.5 truncate font-bold">
              <Folder size={14} />
              {item.collection?.name ?? "未分類"}
            </span>
            <time className="shrink-0">
              {format(item.createdAt, "M月d日", { locale: ja })}
            </time>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/items/${item.id}`}
      className="card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,29,54,0.11)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#f4f0ea] to-[#e8dde9] sm:aspect-[16/8]">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl font-bold text-[var(--primary)] opacity-30">
            {platformLabel(item.sourcePlatform)}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary-dark)]">
            {platformLabel(item.sourcePlatform)}
          </span>
          <ArrowUpRight
            size={15}
            className="text-slate-300 transition group-hover:text-[var(--primary)]"
          />
        </div>
        <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-5 sm:mt-3 sm:min-h-12 sm:text-base sm:leading-6">
          {item.title || item.domain || item.url}
        </h2>
        <p className="mt-1.5 line-clamp-2 min-h-9 text-xs leading-4 text-slate-500 sm:mt-2 sm:min-h-10 sm:text-sm sm:leading-5">
          {item.purpose || item.userMemo || item.description || "メモはまだありません"}
        </p>

        {item.userTags.length ? (
          <div className="mt-3 flex flex-wrap gap-1 sm:mt-4 sm:gap-1.5">
            {[...new Set(item.userTags)].slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 sm:mt-5 sm:pt-4 sm:text-xs">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <Folder size={14} />
            {item.collection?.name ?? "未分類"}
          </span>
          <time>{format(item.createdAt, "M月d日", { locale: ja })}</time>
        </div>
      </div>
    </Link>
  );
}
