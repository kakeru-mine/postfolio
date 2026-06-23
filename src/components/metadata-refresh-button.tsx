"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";

export function MetadataRefreshButton({
  itemId,
  className = "button-secondary px-3 py-2 text-sm",
}: {
  itemId: string;
  className?: string;
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setRefreshing(true);
    setError("");

    try {
      const response = await fetch(`/api/saved-items/${itemId}/metadata`, {
        method: "PATCH",
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "SNS情報を取得できませんでした。");
        return;
      }

      router.refresh();
    } catch {
      setError("SNS情報の取得に接続できませんでした。");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={className}
        onClick={refresh}
        disabled={refreshing}
      >
        {refreshing ? (
          <LoaderCircle className="animate-spin" size={16} />
        ) : (
          <RefreshCw size={16} />
        )}
        {refreshing ? "取得中..." : "SNS情報を再取得"}
      </button>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
