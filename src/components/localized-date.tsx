"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

// Dates are rendered on the server, so the DOM translator can't localize them
// (they're dynamic). Instead this small client component follows the language
// the switcher writes onto <html lang="..."> and formats accordingly: Japanese
// as "M月d日" and English as "MMM d". Marked data-i18n-dynamic so the translator
// never touches it.
export function LocalizedDate({
  date,
  jaPattern = "M月d日",
  enPattern = "MMM d",
}: {
  date: Date | string;
  jaPattern?: string;
  enPattern?: string;
}) {
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

  const value = typeof date === "string" ? new Date(date) : date;
  const text =
    language === "en"
      ? format(value, enPattern)
      : format(value, jaPattern, { locale: ja });

  return (
    <span data-i18n-dynamic suppressHydrationWarning>
      {text}
    </span>
  );
}
