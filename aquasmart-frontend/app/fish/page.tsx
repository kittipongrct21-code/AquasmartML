"use client";
import { useState, useEffect } from "react";
import { getPublicFishList, type FishListItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Search, Filter } from "lucide-react";
import Link from "next/link";

export default function FishCatalogPage() {
  const { t, locale } = useI18n();
  const [fish, setFish] = useState<FishListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFish() {
      try {
        setLoading(true);
        const data = await getPublicFishList();
        if (active) {
          setFish(data);
        }
      } catch (error) {
        console.error("Failed to load fish:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFish();

    return () => {
      active = false;
    };
  }, []);

  const filteredFish = fish.filter((f) => {
    const name = locale === "th" ? f.name_th || f.name : f.name;
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || f.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(fish.map((f) => f.category || "").filter(Boolean))] as string[];

  if (loading) return <LoadingSpinner message={t.common?.loading || "Loading..."} />;

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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder={t.catalog?.searchPlaceholder || "Search fish..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
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

      {filteredFish.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600">{t.catalog?.noMatch || "No fish found"}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFish.map((fish) => (
            <Link
              key={fish.id}
              href={`/fish/${fish.id}`}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-slate-100 relative">
                {fish.cover_image_url ? (
                  <img
                    src={fish.cover_image_url}
                    alt={locale === "th" ? fish.name_th || fish.name : fish.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 mb-1">
                  {locale === "th" ? fish.name_th || fish.name : fish.name}
                </h3>
                {fish.category && (
                  <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    {fish.category}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
