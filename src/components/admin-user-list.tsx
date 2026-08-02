"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  signupMethod: "password" | "google";
  verified: boolean;
  planLabel: string;
  isPaid: boolean;
  subscriptionStatus: string | null;
  savedItemCount: number;
  lastLoginAt: string | null;
  createdAt: string;
};

type Summary = {
  total: number;
  verified: number;
  paid: number;
  newThisMonth: number;
};

const PAGE_SIZE = 25;

const SIGNUP_METHOD_LABEL: Record<UserRow["signupMethod"], string> = {
  password: "パスワード",
  google: "Google",
};

function formatDateTime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildCsv(rows: UserRow[]) {
  const header = [
    "表示名",
    "メールアドレス",
    "登録方法",
    "メール確認",
    "プラン",
    "サブスクステータス",
    "保存件数",
    "最終ログイン",
    "登録日時",
  ];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((row) =>
    [
      row.name ?? "",
      row.email,
      SIGNUP_METHOD_LABEL[row.signupMethod],
      row.verified ? "確認済" : "未確認",
      row.planLabel,
      row.subscriptionStatus ?? "",
      String(row.savedItemCount),
      row.lastLoginAt ? formatDateTime(row.lastLoginAt) : "",
      formatDateTime(row.createdAt),
    ]
      .map(escape)
      .join(","),
  );
  // Prepend BOM so Excel opens the UTF-8 file with Japanese intact.
  return "﻿" + [header.map(escape).join(","), ...lines].join("\r\n");
}

export function AdminUserList({
  users,
  summary,
}: {
  users: UserRow[];
  summary: Summary;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        (user.name ?? "").toLowerCase().includes(q),
    );
  }, [query, users]);

  // Reset to the first page whenever the filter changes.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  function handleExport() {
    const csv = buildCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `postfolio-users-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="登録者数(累計)" value={summary.total} />
        <SummaryCard label="メール確認済み" value={summary.verified} />
        <SummaryCard label="有料プラン" value={summary.paid} />
        <SummaryCard label="今月の新規" value={summary.newThisMonth} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="表示名・メールアドレスで絞り込み"
            className="field pl-9"
          />
        </label>
        <button
          type="button"
          onClick={handleExport}
          disabled={!filtered.length}
          className="button-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          CSVエクスポート
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-xs text-slate-500">
              <th className="px-4 py-3 font-bold">表示名</th>
              <th className="px-4 py-3 font-bold">メールアドレス</th>
              <th className="whitespace-nowrap px-4 py-3 font-bold">登録方法</th>
              <th className="px-4 py-3 font-bold">メール確認</th>
              <th className="px-4 py-3 font-bold">プラン</th>
              <th className="px-4 py-3 text-right font-bold">保存件数</th>
              <th className="px-4 py-3 font-bold">最終ログイン</th>
              <th className="px-4 py-3 font-bold">登録日時</th>
            </tr>
          </thead>
          <tbody>
            {paged.length ? (
              paged.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {user.name ?? "（未設定）"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {user.signupMethod === "google" ? (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                        Google
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        パスワード
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {user.verified ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        確認済
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        未確認
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.isPaid
                          ? "font-bold text-[var(--primary)]"
                          : "text-slate-500"
                      }
                    >
                      {user.planLabel}
                    </span>
                    {user.subscriptionStatus ? (
                      <span className="ml-2 text-xs text-slate-400">
                        {user.subscriptionStatus}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {user.savedItemCount}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {user.lastLoginAt ? (
                      formatDateTime(user.lastLoginAt)
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(user.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  該当する登録者がいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          全 {filtered.length} 件中 {rangeStart}–{rangeEnd} 件を表示
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="button-secondary px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            前へ
          </button>
          <span className="text-xs text-slate-500">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="button-secondary px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
