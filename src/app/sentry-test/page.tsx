"use client";

// TEMPORARY: Sentry verification page. Delete after confirming the stack trace in
// the Sentry "Issues" dashboard resolves to the original source (source maps).
export default function SentryTestPage() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        fontFamily: "system-ui, -apple-system, Meiryo, sans-serif",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Sentry ソースマップ テスト</h1>
        <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
          下のボタン/リンクで意図的にエラーを発生させ、Sentryのトレースが
          元コードの行で表示されるか確認します。確認後このページは削除します。
        </p>
        <button
          type="button"
          onClick={() => {
            throw new Error("Sentry sourcemap client test error (safe to ignore)");
          }}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          クライアントエラーを発生させる
        </button>
        <p style={{ marginTop: 16, fontSize: 13 }}>
          <a
            href="/api/sentry-test"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            サーバーエラーを発生させる（/api/sentry-test）
          </a>
        </p>
      </div>
    </main>
  );
}
