"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { setLanguage as setI18nLanguage, addTranslations } from "@/utils/i18n";

// Shape of the context
type I18nContextValue = {
  lang: "en" | "ru";
  setLang: (lang: "en" | "ru") => void;
};

// Create context
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// Helper to dynamically import language packs (placeholder for scale)
async function loadLanguagePack(lang: "en" | "ru") {
  // For future languages: add dynamic imports here, e.g.:
  // if (lang === "ru") {
  //   const pack = await import("@/utils/i18n-packs/ru");
  //   addTranslations("ru", pack.default || {});
  // }
  // Currently, translations live in utils/i18n.ts, so this is a no-op.
  return;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLang =
    (typeof window !== "undefined" && (localStorage.getItem("appLanguage") as "en" | "ru")) || "en";

  const [lang, setLangState] = useState<"en" | "ru">(initialLang);

  const applyLanguage = (l: "en" | "ru") => {
    setLangState(l);
    setI18nLanguage(l); // keep utils/i18n in sync for existing t() imports
    if (typeof window !== "undefined") {
      localStorage.setItem("appLanguage", l);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadLanguagePack(lang);
      if (!cancelled) {
        // Ensure utils i18n is aligned after pack load (merge via addTranslations if needed)
        setI18nLanguage(lang);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const ctxValue: I18nContextValue = {
    lang,
    setLang: applyLanguage,
  };

  return <I18nContext.Provider value={ctxValue}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}