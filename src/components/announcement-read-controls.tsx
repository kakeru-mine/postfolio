"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

export function MarkReadButton({ announcementId }: { announcementId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function markRead() {
    setError(false);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/announcements/${announcementId}/read`, {
          method: "POST",
        });
        if (!res.ok) throw new Error();
        router.refresh();
      } catch {
        setError(true);
      }
    });
  }

  return (
    <button
      type="button"
      className="button-secondary px-3 py-1.5 text-xs"
      onClick={markRead}
      disabled={pending}
    >
      {pending ? "処理中..." : error ? "再試行" : "既読にする"}
    </button>
  );
}

export function MarkAllReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function markAll() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/announcements/read-all", { method: "POST" });
        if (!res.ok) throw new Error();
        router.refresh();
      } catch {
        // ignore; user can retry
      }
    });
  }

  return (
    <button
      type="button"
      className="button-secondary px-3 py-1.5 text-sm"
      onClick={markAll}
      disabled={pending}
    >
      <Check size={15} />
      {pending ? "処理中..." : "すべて既読にする"}
    </button>
  );
}
