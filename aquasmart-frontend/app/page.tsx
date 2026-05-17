"use client";
import { Camera, Search, Home } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export default function HomePage() {
  const [topFish, setTopFish] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/fish/top-searched`)
      .then((res) => res.json())
      .then((data) => {
        setTopFish(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Hero Section */}
      <section className="text-center space-y-5 py-6">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
          {t.landing.heroTitle}
        </h1>
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {t.landing.heroDesc}
        </p>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-8">
          <Link
            href="/identify"
            className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Camera className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800">{t.landing.qaIdentifyTitle}</span>
            <span className="text-xs text-slate-500 mt-1">{t.landing.qaIdentifyDesc}</span>
          </Link>

          <Link
            href="/fish"
            className="group flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-200 transition-all"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Search className="w-6 h-6" />
            </div>
            <span className="font-semibold text-slate-800">{t.landing.qaBrowseTitle}</span>
            <span className="text-xs text-slate-500 mt-1">{t.landing.qaBrowseDesc}</span>
          </Link>
        </div>
      </section>

      {/* Top Searched Fish */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t.landing.featuredFish}</h2>
            <p className="text-sm text-slate-500 mt-1">{t.landing.featuredFishDesc}</p>
          </div>
          <Link href="/fish" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {t.landing.viewAll} →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : topFish.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {topFish.map((fish: any) => (
              <Link
                href={`/fish/${fish.id}`}
                key={fish.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={fish.cover_image_url || "/placeholder.jpg"}
                    alt={fish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 truncate">{fish.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{fish.search_count || 0} searches</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">{t.landing.noFishData}</p>
          </div>
        )}
      </section>
    </div>
  );
}