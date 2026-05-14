"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { dictionaries, Locale } from "./dictionaries";

type Dictionary = typeof dictionaries.en;

interface I18nContextType {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  // On mount, load locale from localStorage if available
  useEffect(() => {
    const savedLocale = localStorage.getItem("app_locale") as Locale;
    if (savedLocale === "en" || savedLocale === "th") {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app_locale", newLocale);
  };

  const t = dictionaries[locale];

  // Provide context immediately to avoid 'undefined' context errors in children
  // Use visibility hidden before mount to prevent hydration text flashes if locale changes
  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', display: 'contents' }}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

export function getLocalizedValue<T extends Record<string, any>>(
  obj: T | null | undefined,
  key: keyof T & string,
  locale: Locale
): string {
  if (!obj) return "";
  if (locale === "th" && obj[`${key}_th`]) {
    return String(obj[`${key}_th`]);
  }
  return obj[key] ? String(obj[key]) : "";
}
