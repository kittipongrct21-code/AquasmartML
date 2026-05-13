"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getPublicFishList, type FishListItem } from "@/lib/api";

export default function HomePage() {
  const [fishList, setFishList] = useState<FishListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedFish() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await getPublicFishList();

        if (!isMounted) return;
        setFishList(data || []);
      } catch (error) {
        console.error("Failed to load featured fish:", error);
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load featured fish."
        );
        setFishList([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFeaturedFish();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredFish = useMemo(() => {
    return fishList.slice(0, 4);
  }, [fishList]);

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-semibold text-blue-600">AquaSmart ML</p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Fish Search & Identification
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
                Discover fish information from the catalog and identify fish
                from images using the AI model.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/identify"
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Identify Fish
                </Link>

                <Link
                  href="/fish"
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Browse Fish Catalog
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <QuickStat
                  label="Catalog"
                  value={`${fishList.length}`}
                  helper="Published fish records"
                />
                <QuickStat
                  label="AI Support"
                  value="Ready"
                  helper="Image-based fish prediction"
                />
                <QuickStat
                  label="History"
                  value="Tracked"
                  helper="Keep prediction records"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  Quick Actions
                </h2>

                <div className="mt-5 space-y-3">
                  <QuickActionCard
                    href="/identify"
                    title="Identify with AI"
                    description="Upload a fish image and get instant prediction results."
                    primary
                  />

                  <QuickActionCard
                    href="/fish"
                    title="Browse Fish Catalog"
                    description="Explore fish species and view detailed information."
                  />

                  <QuickActionCard
                    href="/history"
                    title="View History"
                    description="Check your recent fish prediction activity."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Featured Fish
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Real fish records loaded from the database.
                </p>
              </div>

              <Link
                href="/fish"
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Loading fish data...
              </div>
            ) : null}

            {!isLoading && errorMessage ? (
              <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            {!isLoading && !errorMessage && featuredFish.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No fish data found.
              </div>
            ) : null}

            {!isLoading && featuredFish.length > 0 ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {featuredFish.map((fish) => (
                  <HomeFishCard key={fish.id} fish={fish} />
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                How it works
              </h2>

              <div className="mt-5 space-y-4">
                <StepCard
                  step="01"
                  title="Upload an image"
                  description="Choose a clear fish photo from your device."
                />
                <StepCard
                  step="02"
                  title="Run AI identification"
                  description="The model predicts the fish class and confidence score."
                />
                <StepCard
                  step="03"
                  title="Review fish details"
                  description="Open the matched fish record and explore the catalog."
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Start now
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Use the AI identification page to predict fish from images, or
                open the catalog to browse species manually.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/identify"
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Open Identify
                </Link>

                <Link
                  href="/fish"
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Open Catalog
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function QuickStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function QuickActionCard({
  href,
  title,
  description,
  primary = false,
}: {
  href: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "block rounded-2xl bg-blue-600 px-4 py-4 text-white transition hover:bg-blue-700"
          : "block rounded-2xl bg-slate-50 px-4 py-4 text-slate-700 transition hover:bg-slate-100"
      }
    >
      <p className="text-base font-bold">{title}</p>
      <p className={primary ? "mt-1 text-sm text-blue-100" : "mt-1 text-sm text-slate-500"}>
        {description}
      </p>
    </Link>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700">
          {step}
        </div>

        <div>
          <p className="text-base font-bold text-slate-900">{title}</p>
          <p className="mt-1 text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function HomeFishCard({ fish }: { fish: FishListItem }) {
  return (
    <Link
      href={`/fish/${fish.id}`}
      className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="flex h-44 items-center justify-center overflow-hidden bg-slate-50">
        {fish.cover_image_url ? (
          <img
            src={fish.cover_image_url}
            alt={fish.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <span className="text-base font-bold text-slate-400">AS</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900 transition group-hover:text-blue-700">
              {fish.name}
            </h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {fish.category || "Fish"}
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
            {fish.type || "Unknown"}
          </span>
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
          {fish.short_description || "No description available."}
        </p>
      </div>
    </Link>
  );
}