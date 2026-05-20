"use client";
import { useState, useEffect, useRef } from "react";
import { getPublicFishList, type FishListItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import { Search, Filter, Clock } from "lucide-react";
import Link from "next/link";

export default function FishCatalogPage() {
  const { t, locale } = useI18n();
  const [fish, setFish] = useState<FishListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // 🕒 States สำหรับระบบประวัติและคำแนะนำคำค้นหา (Dropdown)
  const [history, setHistory] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadFish() {
      try {
        setLoading(true);
        const data = await getPublicFishList();
        if (active) setFish(data);
      } catch (error) {
        console.error("Failed to load fish:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadFish();

    // โหลดประวัติการค้นหาจาก localStorage บนเครื่องผู้ใช้
    const savedHistory = localStorage.getItem("fish_search_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    return () => { active = false; };
  }, []);

  // ปิด Dropdown เมื่อผู้ใช้คลิกพื้นที่ภายนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCategory("");
  }, [locale]);

  // ฟังก์ชันบันทึกประวัติการค้นหาล่าสุด (เก็บไว้สูงสุด 5 คำ)
  const saveToHistory = (keyword: string) => {
    if (!keyword.trim()) return;
    const cleanKeyword = keyword.trim();
    const filteredHistory = history.filter((item) => item !== cleanKeyword);
    const newHistory = [cleanKeyword, ...filteredHistory].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("fish_search_history", JSON.stringify(newHistory));
  };

  // 1. กรองข้อมูลสำหรับ Card รูปปลาด้านล่าง (ตามชื่อ + หมวดหมู่)
  const filteredFish = fish.filter((f) => {
    const name = locale === "th" ? f.name_th || f.name : f.name;
    const fishCategory = locale === "th" ? f.category_th || f.category : f.category;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || fishCategory === category;
    return matchesSearch && matchesCategory;
  });

  // 2. รายชื่อคำแนะนำใน Dropdown (เฉพาะชื่อปลาที่แมตช์ใกล้เคียงคำที่กำลังพิมพ์)
  const suggestions = fish
    .map((f) => (locale === "th" ? f.name_th || f.name : f.name))
    .filter((name) => search && name.toLowerCase().includes(search.toLowerCase()) && name.toLowerCase() !== search.toLowerCase())
    .slice(0, 5);

  const categories = [...new Set(fish.map((f) => (locale === "th" ? f.category_th || f.category : f.category) || "").filter(Boolean))] as string[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {t.catalog?.title || "Fish Catalog"}
        </h1>
        <p className="text-slate-600">
          {t.catalog?.desc || "Browse our collection of fish species"}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          
          {/* ช่องค้นหาพร้อมกล่องแนะนำคำค้นหาอัจฉริยะ */}
          <div className="relative" ref={dropdownRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={t.catalog?.searchPlaceholder || "Search fish..."}
              value={search}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveToHistory(search);
                  setShowDropdown(false);
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />

            {/* 🟢 กล่อง Dropdown ปรับเป็นโทนสว่าง (bg-white, text-slate-900) */}
            {showDropdown && (history.length > 0 || suggestions.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden py-2 max-h-72 overflow-y-auto">
                
                {/* แสดงประวัติเมื่อช่องค้นหายังว่างอยู่ */}
                {!search && history.map((item, index) => (
                  <button
                    key={`hist-${index}`}
                    onClick={() => {
                      setSearch(item);
                      saveToHistory(item);
                      setShowDropdown(false);
                    }}
                    // 🟢 ปรับสีตัวอักษรและ hover ของประวัติ
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 transition text-left"
                  >
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>{item}</span>
                  </button>
                ))}

                {/* แสดงคำแนะนำชื่อปลาตอนเริ่มพิมพ์ตัวอักษร */}
                {search && suggestions.map((item, index) => (
                  <button
                    key={`sug-${index}`}
                    onClick={() => {
                      setSearch(item);
                      saveToHistory(item);
                      setShowDropdown(false);
                    }}
                    // 🟢 ปรับสีตัวอักษรและ hover ของคำแนะนำ
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100 transition text-left"
                  >
                    <Search className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{item}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ตัวเลือกฟิลเตอร์หมวดหมู่ */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white outline-none transition"
            >
              <option value="">{t.catalog?.allCategories || "All Categories"}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ส่วนแสดงผล Card รูปปลาและ Skeleton คงเดิม */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFish.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">{t.catalog?.noMatch || "No fish found"}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFish.map((item) => {
            const displayCategory = locale === "th" ? item.category_th || item.category : item.category;

            return (
              <Link
                key={item.id}
                href={`/fish/${item.id}`}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* ส่วนรูปภาพของตัวปลา */}
                <div className="aspect-video bg-slate-100 relative">
                  {item.cover_image_url ? (
                    <img
                      src={item.cover_image_url}
                      alt={locale === "th" ? item.name_th || item.name : item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                      No Image
                    </div>
                  )}
                </div>

                {/* ส่วนของชื่อปลาและป้ายกำกับด้านล่าง */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {locale === "th" ? item.name_th || item.name : item.name}
                  </h3>
                  {displayCategory && (
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {displayCategory}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}