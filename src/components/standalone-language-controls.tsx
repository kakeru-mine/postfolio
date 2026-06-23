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
      setLanguage(savedLanguage);
      document.documentElement.lang = savedLanguage;
    }
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
