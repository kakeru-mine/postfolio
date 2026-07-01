"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Catches root-level React rendering errors. Reports to Sentry (no-op until a
// DSN is configured) and shows a minimal, self-contained fallback. This file
// replaces the root layout when it renders, so styles are inlined.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Meiryo, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            問題が発生しました
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 1.7,
              color: "#475569",
            }}
          >
            予期しないエラーが発生しました。お手数ですが、もう一度お試しください。
            問題が続く場合は時間をおいて再度アクセスしてください。
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            再読み込みする
          </button>
        </div>
      </body>
    </html>
  );
}
