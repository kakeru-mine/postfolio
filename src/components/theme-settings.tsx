"use client";

import { useState } from "react";
import { Check, Palette, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_THEME,
  getThemeCssVariables,
  type ThemeColors,
} from "@/lib/theme";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function ThemeSettings({ initialTheme }: { initialTheme: ThemeColors }) {
  const router = useRouter();
  const [theme, setTheme] = useState(initialTheme);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  function updateColor(key: keyof ThemeColors, value: string) {
    const nextTheme = { ...theme, [key]: value };
    setTheme(nextTheme);
    setStatus("idle");
    setError("");

    if (HEX_COLOR.test(value)) {
      applyTheme(nextTheme);
    }
  }

  function resetTheme() {
    setTheme(DEFAULT_THEME);
    setStatus("idle");
    setError("");
    applyTheme(DEFAULT_THEME);
  }

  async function saveTheme() {
    if (Object.values(theme).some((color) => !HEX_COLOR.test(color))) {
      setError("カラーコードは #123456 の形式で入力してください。");
      return;
    }

    setStatus("saving");
    setError("");

    try {
      const response = await fetch("/api/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "テーマを保存できませんでした。");
      }

      setStatus("saved");
      router.refresh();
    } catch (saveError) {
      setStatus("idle");
      setError(
        saveError instanceof Error
          ? saveError.message
          : "テーマを保存できませんでした。",
      );
    }
  }

  return (
    <section className="card mt-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary-dark)]">
            <Palette size={19} />
          </span>
          <div>
            <h2 className="font-bold">カラーテーマ</h2>
            <p className="text-sm text-slate-500">
              アプリの背景、メイン、アクセント、サイドバーの色を変更できます。
            </p>
          </div>
        </div>
        <button type="button" className="button-secondary" onClick={resetTheme}>
          <RotateCcw size={16} />
          初期カラーに戻す
        </button>
      </div>

      <div className="mt-6 grid gap-6 border-t border-slate-100 pt-6 lg:grid-cols-[1fr_1.05fr]">
        <div className="space-y-4">
          <ColorField
            label="背景色"
            value={theme.background}
            onChange={(value) => updateColor("background", value)}
          />
          <ColorField
            label="メインカラー"
            description="選択中のタブや見出し、グラデーションに使われます。"
            value={theme.main}
            onChange={(value) => updateColor("main", value)}
          />
          <ColorField
            label="アクセントカラー"
            description="「新規作成」や保存ボタンなど、主要な操作に使われます。"
            value={theme.accent}
            onChange={(value) => updateColor("accent", value)}
          />
          <ColorField
            label="サイドバー"
            value={theme.sidebar}
            onChange={(value) => updateColor("sidebar", value)}
          />

          {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}

          <button
            type="button"
            className="button-primary w-full"
            disabled={status === "saving"}
            onClick={saveTheme}
          >
            {status === "saved" ? <Check size={17} /> : null}
            {status === "saving"
              ? "保存中..."
              : status === "saved"
                ? "保存しました"
                : "このカラーを保存"}
          </button>
        </div>

        <ThemePreview theme={theme} />
      </div>
    </section>
  );
}

function ColorField({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      {description ? (
        <span className="mt-1 block text-xs leading-5 text-slate-400">
          {description}
        </span>
      ) : null}
      <span className="mt-2 flex items-center gap-3">
        <input
          type="color"
          value={HEX_COLOR.test(value) ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
          aria-label={`${label}を選択`}
        />
        <input
          type="text"
          value={value}
          maxLength={7}
          onChange={(event) => onChange(event.target.value)}
          className="field font-mono uppercase"
          aria-label={`${label}のカラーコード`}
        />
      </span>
    </label>
  );
}

function ThemePreview({ theme }: { theme: ThemeColors }) {
  const validTheme = Object.values(theme).every((color) => HEX_COLOR.test(color))
    ? theme
    : DEFAULT_THEME;
  const variables = getThemeCssVariables(validTheme) as React.CSSProperties;

  return (
    <div>
      <p className="mb-2 text-sm font-bold">プレビュー</p>
      <div
        className="grid min-h-72 grid-cols-[105px_1fr] overflow-hidden rounded-2xl border border-slate-200 shadow-sm"
        style={variables}
      >
        <div className="bg-[var(--sidebar)] p-4 text-[var(--sidebar-foreground)]">
          <p className="text-sm font-bold">Postfolio</p>
          <div className="mt-6 space-y-2 text-xs opacity-80">
            <p className="rounded-lg bg-white/12 px-2 py-2">保存アイテム</p>
            <p className="px-2 py-2">コレクション</p>
            <p className="px-2 py-2">設定</p>
          </div>
        </div>
        <div className="bg-[var(--canvas)] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[var(--primary)]">PREVIEW</p>
              <p className="mt-1 font-bold">保存アイテム</p>
            </div>
            <span className="button-primary px-3 py-2 text-xs">新規作成</span>
          </div>
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary-dark)]">
              YouTube
            </span>
            <p className="mt-3 text-sm font-bold">保存した投稿のタイトル</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              選択した配色がアプリ全体に反映されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function applyTheme(theme: ThemeColors) {
  const variables = getThemeCssVariables(theme);

  for (const [name, value] of Object.entries(variables)) {
    document.documentElement.style.setProperty(name, value);
  }
}
