"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAdminFishById } from "@/lib/api";

type FishImageItem = {
  id: number;
  fish_id: number;
  image_url: string;
  alt_text?: string | null;
  is_cover?: boolean;
};

type FishRecord = {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  type?: string | null;
  category?: string | null;
  habitat?: string | null;
  identify_text?: string | null;
  average_lifespan?: string | null;
  adult_size?: string | null;
  cover_image_url?: string | null;
  is_active?: boolean;
  origin?: string | null;
};

type FishDetailResponse = {
  fish: FishRecord;
  farmer_info?: Record<string, unknown> | null;
  ornamental_info?: Record<string, unknown> | null;
  images?: FishImageItem[];
};

type DetailTab = "general" | "farmer" | "ornamental" | "gallery";

const HIDDEN_INFO_KEYS = new Set([
  "id",
  "fish_id",
  "created_at",
  "updated_at",
  "cover_image_url",
  "is_active",
  "name",
  "slug",
  "short_description",
  "type",
  "category",
  "habitat",
  "identify_text",
  "average_lifespan",
  "adult_size",
  "origin",
]);

export default function AdminFishDetailPage() {
  const params = useParams<{ id: string }>();
  const fishId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [data, setData] = useState<FishDetailResponse | null>(null);
  const [tab, setTab] = useState<DetailTab>("general");
  const [selectedImage, setSelectedImage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadFishDetail() {
      if (!fishId) {
        setErrorMessage("Fish ID is missing.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const detail = (await getAdminFishById(fishId)) as FishDetailResponse;

        if (!isMounted) return;

        setData(detail);

        const firstImage =
          detail?.fish?.cover_image_url ||
          detail?.images?.find((image) => image.is_cover)?.image_url ||
          detail?.images?.[0]?.image_url ||
          "";

        setSelectedImage(firstImage);
      } catch (error) {
        console.error("Failed to load admin fish detail:", error);

        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load fish detail."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFishDetail();

    return () => {
      isMounted = false;
    };
  }, [fishId]);

  const fish = data?.fish;

  const galleryImages = useMemo<FishImageItem[]>(() => {
    if (!data?.images?.length) return [];

    const uniqueMap = new Map<string, FishImageItem>();

    data.images.forEach((image) => {
      const key = `${image.id}-${image.image_url}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, image);
      }
    });

    return Array.from(uniqueMap.values());
  }, [data?.images]);

  const generalCards = useMemo(() => {
    if (!fish) return [];

    return [
      { label: "Fish ID", value: String(fish.id) },
      { label: "Slug", value: fish.slug || "Not available" },
      { label: "Type", value: fish.type || "Not available" },
      { label: "Category", value: fish.category || "Not available" },
      { label: "Origin", value: fish.origin || "Not available" },
      { label: "Habitat", value: fish.habitat || "Not available" },
      {
        label: "Average Lifespan",
        value: fish.average_lifespan || "Not available",
      },
      { label: "Adult Size", value: fish.adult_size || "Not available" },
      {
        label: "Public Status",
        value: fish.is_active ? "Active" : "Inactive",
      },
    ];
  }, [fish]);

  const farmerEntries = useMemo(() => {
    return buildInfoEntries(data?.farmer_info || null);
  }, [data?.farmer_info]);

  const ornamentalEntries = useMemo(() => {
    return buildInfoEntries(data?.ornamental_info || null);
  }, [data?.ornamental_info]);

  if (isLoading) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Loading fish detail...</p>
      </section>
    );
  }

  if (errorMessage || !fish) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-600">Admin</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Fish Detail
              </h1>
            </div>

            <Link
              href="/admin/fish"
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Back to Fish Management
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {errorMessage || "Fish not found."}
          </div>
        </div>
      </section>
    );
  }

  const displayImage =
    selectedImage ||
    fish.cover_image_url ||
    galleryImages.find((image) => image.is_cover)?.image_url ||
    galleryImages[0]?.image_url ||
    "";

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/fish"
          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          Back to Fish Management
        </Link>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/fish/${fish.id}`}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            View Public Page
          </Link>

          <Link
            href={`/admin/fish/${fish.id}/edit`}
            className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Edit Fish
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-slate-50 p-4">
            <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-white">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={fish.name}
                  className="h-full max-h-[420px] w-full object-contain"
                />
              ) : (
                <div className="px-6 py-10 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-2xl font-bold text-blue-600">
                    AS
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    No image available
                  </p>
                </div>
              )}
            </div>

            {galleryImages.length > 0 ? (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {galleryImages.map((image) => {
                  const active = selectedImage === image.image_url;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImage(image.image_url)}
                      className={
                        active
                          ? "overflow-hidden rounded-2xl ring-2 ring-blue-500"
                          : "overflow-hidden rounded-2xl ring-1 ring-slate-200"
                      }
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || fish.name}
                        className="h-20 w-20 object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">Admin Detail</p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                  {fish.name}
                </h1>
              </div>

              <span
                className={
                  fish.is_active
                    ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                }
              >
                {fish.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {fish.short_description || "No description available."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoBox label="Type" value={fish.type || "Not available"} />
              <InfoBox
                label="Category"
                value={fish.category || "Not available"}
              />
              <InfoBox label="Origin" value={fish.origin || "Not available"} />
              <InfoBox label="Habitat" value={fish.habitat || "Not available"} />
            </div>

            {fish.identify_text ? (
              <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Identification Guide
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {fish.identify_text}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={tab === "general"}
            label="General"
            onClick={() => setTab("general")}
          />
          <TabButton
            active={tab === "farmer"}
            label="Farmer"
            onClick={() => setTab("farmer")}
          />
          <TabButton
            active={tab === "ornamental"}
            label="Ornamental"
            onClick={() => setTab("ornamental")}
          />
          <TabButton
            active={tab === "gallery"}
            label="Gallery"
            onClick={() => setTab("gallery")}
          />
        </div>
      </section>

      {tab === "general" ? (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            General Information
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {generalCards.map((item) => (
              <InfoBox key={item.label} label={item.label} value={item.value} />
            ))}
          </div>

          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Identification Notes
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              {fish.identify_text || "Not available"}
            </p>
          </div>
        </section>
      ) : null}

      {tab === "farmer" ? (
        <DetailSection
          title="Farmer Information"
          emptyMessage="No farmer information is available for this fish yet."
          items={farmerEntries}
        />
      ) : null}

      {tab === "ornamental" ? (
        <DetailSection
          title="Ornamental Information"
          emptyMessage="No ornamental information is available for this fish yet."
          items={ornamentalEntries}
        />
      ) : null}

      {tab === "gallery" ? (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Gallery</h2>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {galleryImages.length} image{galleryImages.length === 1 ? "" : "s"}
              </div>

              <Link
                href={`/admin/fish/${fish.id}/edit`}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Manage Gallery
              </Link>
            </div>
          </div>

          {galleryImages.length === 0 ? (
            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              No images uploaded yet.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {galleryImages.map((image) => (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                >
                  <div className="flex h-56 items-center justify-center overflow-hidden bg-slate-50">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || fish.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {image.alt_text || "Fish image"}
                      </p>

                      {image.is_cover ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Cover
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          : "rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
      }
    >
      {label}
    </button>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-7 text-slate-800">
        {value}
      </p>
    </div>
  );
}

function DetailSection({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <InfoBox key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )}
    </section>
  );
}

function buildInfoEntries(
  source: Record<string, unknown> | null
): Array<{ label: string; value: string }> {
  if (!source) return [];

  return Object.entries(source)
    .filter(([key, value]) => {
      if (HIDDEN_INFO_KEYS.has(key)) return false;
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    })
    .map(([key, value]) => ({
      label: humanizeKey(key),
      value: String(value),
    }));
}

function humanizeKey(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
