"use client";

import { useEffect, useState } from "react";

// Tracks the active UI language. The language switcher (app-shell /
// StandaloneLanguageControls) writes it to <html lang="...">, so we observe that
// attribute and stay in sync with the rest of the page's translation.
function useDocumentLanguage(): "ja" | "en" {
  const [language, setLanguage] = useState<"ja" | "en">("ja");

  useEffect(() => {
    const read = () =>
      setLanguage(document.documentElement.lang === "en" ? "en" : "ja");
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    return () => observer.disconnect();
  }, []);

  return language;
}

// Turn bare http(s) URLs into clickable links. Text is rendered by React
// (escaped), so this stays XSS-safe.
function renderBody(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-[var(--primary)] underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      part
    ),
  );
}

export function TranslatableTitle({
  ja,
  en,
}: {
  ja: string;
  en: string | null;
}) {
  const language = useDocumentLanguage();
  return <>{language === "en" && en ? en : ja}</>;
}

export function TranslatableBody({
  ja,
  en,
}: {
  ja: string;
  en: string | null;
}) {
  const language = useDocumentLanguage();
  return <>{renderBody(language === "en" && en ? en : ja)}</>;
}
