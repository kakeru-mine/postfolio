"use client";

import { ArrowLeft } from "lucide-react";

export function BackToPreviousButton({
  label = "Postfolioに戻る",
  fallbackHref = "/welcome",
  preferHistory = true,
}: {
  label?: string;
  fallbackHref?: string;
  preferHistory?: boolean;
}) {
  function goBack() {
    if (!preferHistory) {
      window.location.assign(fallbackHref);
      return;
    }

    const savedReturnTo = sessionStorage.getItem("postfolio_legal_return_to");
    if (savedReturnTo && savedReturnTo !== window.location.pathname) {
      sessionStorage.removeItem("postfolio_legal_return_to");
      window.location.assign(savedReturnTo);
      return;
    }

    try {
      const referrer = document.referrer
        ? new URL(document.referrer)
        : null;

      if (
        referrer?.origin === window.location.origin &&
        document.referrer !== window.location.href
      ) {
        window.history.back();
        return;
      }
    } catch {
      // Fall through to the public entry page.
    }

    window.location.assign(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[var(--primary)]"
    >
      <ArrowLeft size={17} />
      {label}
    </button>
  );
}
