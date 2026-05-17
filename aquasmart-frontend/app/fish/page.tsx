"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPublicFishList, type FishListItem } from "@/lib/api";
import { useI18n, getLocalizedValue } from "@/lib/i18n-context";

export default function FishDirectoryPage() {
  const { locale, t } = useI18n();
  const [fishList, setFishList] = useState<FishListItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadFish() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getPublicFishList();

        if (!isMounted) return;
        setFishList(data || []);
      } catch (error) {
        console.error("Failed to load fish list:", error);

        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load fish catalog."
        );
        setFishList([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFish();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFish = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return fishList.filter((fish) => {
      const name = (getLocalizedValue(fish, "name", locale) || "").toLowerCase();
      const slug = (fish.slug || "").toLowerCase();
      const desc = (getLocalizedValue(fish, "short_description", locale) || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        slug.includes(keyword) ||
        desc.includes(keyword);

      return matchesSearch;
    });
  }, [fishList, search, locale]);

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">{t.catalog.title}</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                {t.catalog.subtitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {t.catalog.desc}
              </p>
            </div>
            <Link
              href="/identify"
              className="inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {t.catalog.tryAi}
            </Link>
          </div>

          {/* แสดงแค่จำนวนปลาทั้งหมด */}
          <div className="mt-6">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {t.catalog.publishedFish}
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                {fishList.length}
              </p>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div>
            <label
              htmlFor="search"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              {t.catalog.searchLabel}
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.catalog.searchPlaceholder}
              className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {filteredFish.length} {t.catalog.records}
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {t.catalog.clearFilters}
            </button>
          </div>
        </section>

        {/* Loading State */}
        {isLoading ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {t.catalog.loading}
            </div>
          </section>
        ) : null}

        {/* Error State */}
        {!isLoading && errorMessage ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          </section>
        ) : null}

        {/* No Results */}
        {!isLoading && !errorMessage && filteredFish.length === 0 ? (
          <section className="rounded-3xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{t.catalog.noMatch}</h3>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search</p>
          </section>
        ) : null}

        {/* Fish Grid - แบบง่าย ไม่มี tags */}
        {!isLoading && !errorMessage && filteredFish.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFish.map((fish) => (
              <Link
                href={`/fish/${fish.id}`}
                key={fish.id}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex h-52 items-center justify-center overflow-hidden bg-slate-50">
                  {fish.cover_image_url ? (
                    <img
                      src={fish.cover_image_url}
                      alt={getLocalizedValue(fish, "name", locale) || fish.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-100">
                      <span className="text-base font-bold text-slate-400">AS</span>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 transition group-hover:text-blue-700">
                    {getLocalizedValue(fish, "name", locale) || fish.name}
                  </h2>
                  
                  <p className="mt-2 line-clamp-2 text-sm leading-7 text-slate-600">
                    {getLocalizedValue(fish, "short_description", locale) || t.catalog.noDesc}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-blue-600">
                      {t.catalog.openDetails}
                    </span>
                    <span className="text-lg text-slate-300 transition group-hover:text-blue-600">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}