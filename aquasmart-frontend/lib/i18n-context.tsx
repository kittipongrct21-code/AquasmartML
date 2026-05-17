"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { dictionaries, type Locale } from "./dictionaries";

type Dictionary = typeof dictionaries.en;

interface I18nContextType {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const savedLocale = localStorage.getItem("app_locale");
  return savedLocale === "th" ? "th" : "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app_locale", newLocale);
  };

  const t = dictionaries[locale] ?? dictionaries.en;

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
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

export function getLocalizedValue<T extends Record<string, unknown>>(
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
