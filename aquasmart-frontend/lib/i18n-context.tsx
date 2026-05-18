"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "@/dictionaries/en";
import { th } from "@/dictionaries/th";

type Locale = "en" | "th";

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof en;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  
  // ✅ 1. เพิ่ม State เพื่อเช็กว่าตอนนี้กำลังรันอยู่บนบราวเซอร์ (Client) หรือยัง
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // โค้ดนี้จะทำงานเฉพาะบนบราวเซอร์เท่านั้น
    const saved = localStorage.getItem("locale") as Locale;
    if (saved === "th" || saved === "en") {
      setLocaleState(saved);
    }
    // ✅ 2. สั่งเปิดไฟเขียวเมื่อโหลดเสร็จ
    setIsMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
  };

  const t = locale === "th" ? th : en;

  // ✅ 3. ท่าไม้ตาย: ถ้าระบบยังไม่ Mount ให้รอไปก่อน ห้ามเพิ่งเรนเดอร์หน้าจอ
  // (แก้ปัญหา React Error #418 Hydration Mismatch แบบถอนรากถอนโคน)
  if (!isMounted) {
    return null; 
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

// ฟังก์ชันช่วยดึงค่าสองภาษาจากฐานข้อมูล (เหมือนเดิม)
export function getLocalizedValue(
  obj: Record<string, any> | null | undefined,
  baseKey: string,
  locale: "en" | "th"
): string {
  if (!obj) return "";
  
  if (locale === "th") {
    const thKey = `${baseKey}_th`;
    if (obj[thKey] && typeof obj[thKey] === "string" && obj[thKey].trim() !== "") {
      return obj[thKey];
    }
  }
  
  return obj[baseKey] ? String(obj[baseKey]) : "";
}