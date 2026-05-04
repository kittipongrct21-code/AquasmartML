"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import FishForm from "@/components/admin/FishForm";
import { apiFetch } from "@/lib/api";
import { FishPayload } from "@/types/fish";

type FishDetailResponse = {
  fish: {
    id: number;
    name: string;
    slug: string;
    short_description?: string;
    type?: string;
    category?: string;
    habitat?: string;
    identify_text?: string;
    average_lifespan?: string;
    adult_size?: string;
    cover_image_url?: string;
    is_active: boolean;
  };
  farmer_info?: {
    how_to_raise?: string;
    pond_type?: string;
    pond_size?: string;
    population_per_pond?: string;
    water_temp?: string;
    ph?: string;
    water_prep?: string;
    recommended_food?: string;
    not_recommended_food?: string;
    feeding_frequency?: string;
  } | null;
  ornamental_info?: {
    environment?: string;
    population?: string;
    water_temp?: string;
    ph?: string;
    preparation?: string;
    recommended_food?: string;
    feeding_frequency?: string;
    feeding_amount?: string;
  } | null;
  images?: unknown[];
};

export default function AdminEditFishPage() {
  const params = useParams();
  const fishId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialData, setInitialData] = useState<FishPayload | null>(null);

  useEffect(() => {
    const loadFish = async () => {
      try {
        setLoading(true);
        const res = await apiFetch<FishDetailResponse>(`/admin/fish/${fishId}`);

        const mapped: FishPayload = {
          general: {
            name: res.fish.name || "",
            slug: res.fish.slug || "",
            short_description: res.fish.short_description || "",
            type: res.fish.type || "",
            category: res.fish.category || "",
            habitat: res.fish.habitat || "",
            identify_text: res.fish.identify_text || "",
            average_lifespan: res.fish.average_lifespan || "",
            adult_size: res.fish.adult_size || "",
            cover_image_url: res.fish.cover_image_url || "",
            is_active: !!res.fish.is_active,
          },
          farmer: {
            how_to_raise: res.farmer_info?.how_to_raise || "",
            pond_type: res.farmer_info?.pond_type || "",
            pond_size: res.farmer_info?.pond_size || "",
            population_per_pond: res.farmer_info?.population_per_pond || "",
            water_temp: res.farmer_info?.water_temp || "",
            ph: res.farmer_info?.ph || "",
            water_prep: res.farmer_info?.water_prep || "",
            recommended_food: res.farmer_info?.recommended_food || "",
            not_recommended_food: res.farmer_info?.not_recommended_food || "",
            feeding_frequency: res.farmer_info?.feeding_frequency || "",
          },
          ornamental: {
            environment: res.ornamental_info?.environment || "",
            population: res.ornamental_info?.population || "",
            water_temp: res.ornamental_info?.water_temp || "",
            ph: res.ornamental_info?.ph || "",
            preparation: res.ornamental_info?.preparation || "",
            recommended_food: res.ornamental_info?.recommended_food || "",
            feeding_frequency: res.ornamental_info?.feeding_frequency || "",
            feeding_amount: res.ornamental_info?.feeding_amount || "",
          },
        };

        setInitialData(mapped);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load fish");
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(fishId)) {
      loadFish();
    }
  }, [fishId]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Edit Fish</h1>
          <p className="mt-1 text-sm text-slate-500">
            Update fish information in AquaSmart ML.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-6 shadow-sm text-slate-500">
            Loading fish data...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-600">
            {error}
          </div>
        ) : initialData ? (
          <FishForm mode="edit" fishId={fishId} initialData={initialData} />
        ) : (
          <div className="rounded-3xl bg-white p-6 shadow-sm text-slate-500">
            Fish not found.
          </div>
        )}
      </div>
    </main>
  );
}