"use client";

import { useI18n } from "@/lib/i18n-context";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex h-10 items-center justify-center rounded-full bg-slate-100 p-1 ring-1 ring-slate-200">
      <button
        onClick={() => setLocale("en")}
        className={`flex h-8 w-10 items-center justify-center rounded-full text-xs font-bold transition ${
          locale === "en" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => setLocale("th")}
        className={`flex h-8 w-10 items-center justify-center rounded-full text-xs font-bold transition ${
          locale === "th" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
        aria-label="Thai"
      >
        TH
      </button>
    </div>
  );
}
