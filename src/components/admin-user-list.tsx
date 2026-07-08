"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  verified: boolean;
  planLabel: string;
  isPaid: boolean;
  subscriptionStatus: string | null;
  createdAt: string;
};

type Summary = {
  total: number;
  verified: number;
  paid: number;
  newThisMonth: number;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AdminUserList({
  users,
  summary,
}: {
  users: UserRow[];
  summary: Summary;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        (user.name ?? "").toLowerCase().includes(q),
    );
  }, [query, users]);

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="登録者数(累計)" value={summary.total} />
        <SummaryCard label="メール確認済み" value={summary.verified} />
        <SummaryCard label="有料プラン" value={summary.paid} />
        <SummaryCard label="今月の新規" value={summary.newThisMonth} />
      </div>

      <label className="relative block">
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

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-xs text-slate-500">
              <th className="px-4 py-3 font-bold">表示名</th>
              <th className="px-4 py-3 font-bold">メールアドレス</th>
              <th className="px-4 py-3 font-bold">メール確認</th>
              <th className="px-4 py-3 font-bold">プラン</th>
              <th className="px-4 py-3 font-bold">登録日時</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {user.name ?? "（未設定）"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
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
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(user.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  該当する登録者がいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        {filtered.length} / {users.length} 件を表示
      </p>
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
