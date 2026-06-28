"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CheckoutSync({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function sync() {
      try {
        const response = await fetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const result = await response.json();
        if (!response.ok) {
          if (active) setError(result.error ?? "契約情報を同期できませんでした。");
          return;
        }
        router.replace("/pricing?checkout=success");
        router.refresh();
      } catch {
        if (active) setError("契約情報を同期できませんでした。");
      }
    }

    void sync();
    return () => {
      active = false;
    };
  }, [router, sessionId]);

  if (error) {
    return (
      <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
        {error} Webhook反映後に再読み込みしてください。
      </p>
    );
  }

  return (
    <p className="mt-6 flex items-center gap-2 rounded-xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
      <LoaderCircle className="animate-spin" size={17} />
      契約情報を反映しています...
    </p>
  );
}
