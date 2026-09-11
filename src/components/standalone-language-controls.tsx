"use client";

import { useEffect, useState } from "react";
import {
  LanguageSwitcher,
  type AppLanguage,
} from "@/components/language-switcher";
import { LanguageDomTranslator } from "@/components/language-dom-translator";

export function StandaloneLanguageControls() {
  const [language, setLanguage] = useState<AppLanguage>("ja");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("postfolio-language");
    if (savedLanguage === "ja" || savedLanguage === "en") {
      // An explicit past choice always wins.
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
      return;
    }
    // First visit: pick the initial language from the browser locale. Japanese
    // browsers start in Japanese, everything else in English. Not persisted, so
    // it keeps following the browser until the visitor makes an explicit choice.
    const detected = (navigator.language || "").toLowerCase().startsWith("ja")
      ? "ja"
      : "en";
    setLanguage(detected);
    document.documentElement.lang = detected;
  }, []);

  function changeLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    window.localStorage.setItem("postfolio-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
  }

  return (
    <>
      <LanguageDomTranslator language={language} />
      <LanguageSwitcher
        language={language}
        onChange={changeLanguage}
        variant="floating"
      />
    </>
  );
}
