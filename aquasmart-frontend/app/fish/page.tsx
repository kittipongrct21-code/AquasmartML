"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPublicFishList, type FishListItem } from "@/lib/api";
import { useI18n, getLocalizedValue } from "@/lib/i18n-context";

export default function FishDirectoryPage() {
  const { locale, t } = useI18n();
  const [fishList, setFishList] = useState<FishListItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");

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

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        fishList
          .map((fish) => (getLocalizedValue(fish, "category", locale) || "").trim())
          .filter((value) => value.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [fishList, locale]);

  const fishTypes = useMemo(() => {
    return Array.from(
      new Set(
        fishList
          .map((fish) => (getLocalizedValue(fish, "type", locale) || "").trim())
          .filter((value) => value.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [fishList, locale]);

  const filteredFish = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return fishList.filter((fish) => {
      const name = (getLocalizedValue(fish, "name", locale) || "").toLowerCase();
      const slug = (fish.slug || "").toLowerCase();
      const desc = (getLocalizedValue(fish, "short_description", locale) || "").toLowerCase();
      const cat = (getLocalizedValue(fish, "category", locale) || "").toLowerCase();
      const type = (getLocalizedValue(fish, "type", locale) || "").toLowerCase();

      const matchesSearch =
        !keyword ||
        name.includes(keyword) ||
        slug.includes(keyword) ||
        desc.includes(keyword) ||
        cat.includes(keyword) ||
        type.includes(keyword);

      const matchesCategory =
        !selectedCategory || (getLocalizedValue(fish, "category", locale) || "") === selectedCategory;

      const matchesType = !selectedType || (getLocalizedValue(fish, "type", locale) || "") === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [fishList, search, selectedCategory, selectedType, locale]);

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedType("");
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-6xl space-y-6">
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

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={t.catalog.publishedFish} value={String(fishList.length)} />
            <StatCard
              label={t.catalog.categories}
              value={String(categories.length)}
            />
            <StatCard
              label={t.catalog.types}
              value={String(fishTypes.length)}
            />
            <StatCard
              label={t.catalog.filteredResults}
              value={String(filteredFish.length)}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px_220px]">
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

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {t.catalog.categoryLabel}
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">{t.catalog.allCategories}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="fish-type"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                {t.catalog.typeLabel}
              </label>
              <select
                id="fish-type"
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">{t.catalog.allTypes}</option>
                {fishTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              {t.catalog.clearFilters}
            </button>

            <Link
              href="/identify"
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              {t.catalog.tryAi}
            </Link>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {t.catalog.loading}
            </div>
          </section>
        ) : null}

        {!isLoading && errorMessage ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          </section>
        ) : null}

        {!isLoading && !errorMessage && filteredFish.length === 0 ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {t.catalog.noMatch}
            </div>
          </section>
        ) : null}

        {!isLoading && !errorMessage && filteredFish.length > 0 ? (
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredFish.map((fish) => (
              <FishCatalogCard key={fish.id} fish={fish} />
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FishCatalogCard({ fish }: { fish: FishListItem }) {
  const { locale, t } = useI18n();

  return (
    <Link
      href={`/fish/${fish.id}`}
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 transition group-hover:text-blue-700">
              {getLocalizedValue(fish, "name", locale) || fish.name}
            </h2>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {fish.slug}
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
            {getLocalizedValue(fish, "type", locale) || t.catalog.unknown}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {getLocalizedValue(fish, "category", locale) ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {getLocalizedValue(fish, "category", locale)}
            </span>
          ) : null}

          {getLocalizedValue(fish, "origin", locale) ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {getLocalizedValue(fish, "origin", locale)}
            </span>
          ) : null}
        </div>

        <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">
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
  );
}