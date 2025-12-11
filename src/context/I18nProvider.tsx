"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { setLanguage as setI18nLanguage, getLanguage, loadLanguage, setMissingKeyWarnings } from "@/utils/i18n";

// Shape of the context
type I18nContextValue = {
  lang: "en" | "ru";
  setLang: (lang: "en" | "ru") => void;
};

// Create context
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialLang =
    (typeof window !== "undefined" && (localStorage.getItem("appLanguage") as "en" | "ru")) || "en";

  const [lang, setLangState] = useState<"en" | "ru">(initialLang);

  const applyLanguage = (l: "en" | "ru") => {
    setLangState(l);
    setI18nLanguage(l);
    if (typeof window !== "undefined") {
      localStorage.setItem("appLanguage", l);
    }
  };

  useEffect(() => {
    // Disable missing key warnings in production (keep them in dev)
    if (import.meta.env.MODE === "production") {
      setMissingKeyWarnings(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Ensure language pack is loaded if using dynamic imports for future languages
      await loadLanguage(lang);
      if (!cancelled) {
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