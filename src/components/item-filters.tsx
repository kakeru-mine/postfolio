"use client";

import type { SourcePlatform } from "@prisma/client";
import Link from "next/link";
import { useRef } from "react";
import { platformLabel, supportedPlatforms } from "@/lib/platform";

const platformTabs = supportedPlatforms;

export function ItemFilters({
  q,
  platform,
  collectionId,
  tag,
  collections,
  tags,
}: {
  q: string;
  platform: string;
  collectionId: string;
  tag: string;
  collections: { id: string; name: string }[];
  tags: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function tabHref(value: SourcePlatform | "") {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (collectionId) params.set("collectionId", collectionId);
    if (tag) params.set("tag", tag);
    if (value) params.set("platform", value);
    const query = params.toString();
    return query ? `/items?${query}` : "/items";
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-white/95 shadow-[0_18px_50px_rgba(17,24,39,0.08)] backdrop-blur">
      <form
        ref={formRef}
        className="grid gap-1.5 p-2 md:grid-cols-[minmax(260px,1fr)_220px_180px_auto] md:gap-3 md:p-3.5"
      >
        <input type="hidden" name="platform" value={platform} />
        <label>
          <input
            name="q"
            defaultValue={q}
            className="field rounded-2xl border-[var(--line)] bg-stone-50/80 py-1.5 text-xs shadow-inner shadow-stone-100/70 md:py-3 md:text-sm"
            onChange={(event) => {
              if (event.currentTarget.value.trim() === "") {
                formRef.current?.requestSubmit();
              }
            }}
            placeholder="タイトル、メモ、URLで検索"
          />
        </label>
        <select
          name="collectionId"
          defaultValue={collectionId}
          className="field rounded-2xl border-[var(--line)] bg-stone-50/80 py-1.5 text-xs md:py-3 md:text-sm"
        >
          <option value="">すべてのコレクション</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        <select
          name="tag"
          defaultValue={tag}
          className="field rounded-2xl border-[var(--line)] bg-stone-50/80 py-1.5 text-xs md:py-3 md:text-sm"
        >
          <option value="">すべてのタグ</option>
          {tags.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button className="button-secondary rounded-2xl border-[var(--line)] px-3 py-1.5 text-xs shadow-sm hover:border-[var(--primary)]/30 md:py-3 md:text-sm">絞り込む</button>
      </form>

      <nav
        aria-label="SNSで絞り込む"
        className="grid grid-cols-3 gap-1 border-t border-[var(--line)] bg-stone-50/80 p-2 sm:flex sm:gap-1.5 sm:overflow-x-auto sm:p-3 sm:pt-2.5"
      >
        <PlatformTab href={tabHref("")} label="すべて" active={!platform} />
        {platformTabs.map((value) => (
          <PlatformTab
            key={value}
            href={tabHref(value)}
            label={platformLabel(value)}
            active={platform === value}
          />
        ))}
      </nav>
    </div>
  );
}

function PlatformTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "w-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-end)] px-1.5 py-1.5 text-[10px] font-bold text-white shadow-sm sm:w-auto sm:shrink-0 sm:px-4 sm:py-2 sm:text-sm"
          : "w-full rounded-full border border-[var(--line)] bg-white px-1.5 py-1.5 text-[10px] font-bold text-[var(--muted)] transition hover:border-[var(--primary)]/25 hover:bg-blue-50 hover:text-[var(--primary)] sm:w-auto sm:shrink-0 sm:px-4 sm:py-2 sm:text-sm"
      }
    >
      {label}
    </Link>
  );
}
