"use client";

import { Languages } from "lucide-react";

export type AppLanguage = "ja" | "en";

export function LanguageSwitcher({
  language,
  onChange,
  variant = "header",
}: {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
  variant?: "header" | "floating";
}) {
  const nextLanguage = language === "ja" ? "en" : "ja";
  const className =
    variant === "floating"
      ? "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[var(--ink)] shadow-lg transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
      : "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold transition hover:bg-white/15";

  return (
    <button
      type="button"
      aria-label={language === "ja" ? "Switch language to English" : "言語を日本語に切り替え"}
      onClick={() => onChange(nextLanguage)}
      className={className}
    >
      <Languages size={16} />
      <span>{language === "ja" ? "日本語" : "English"}</span>
    </button>
  );
}
