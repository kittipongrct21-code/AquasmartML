"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FishPayload } from "@/types/fish";
import { apiFetch } from "@/lib/api";

type FishFormProps = {
  mode?: "create" | "edit";
  fishId?: number;
  initialData?: FishPayload;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500";
const labelClass = "mb-2 block text-sm font-medium text-slate-700";
const sectionTitleClass = "text-lg font-semibold text-slate-900";

const emptyData: FishPayload = {
  general: {
    name: "",
    slug: "",
    short_description: "",
    type: "",
    category: "",
    habitat: "",
    identify_text: "",
    average_lifespan: "",
    adult_size: "",
    cover_image_url: "",
    is_active: true,
  },
  farmer: {
    how_to_raise: "",
    pond_type: "",
    pond_size: "",
    population_per_pond: "",
    water_temp: "",
    ph: "",
    water_prep: "",
    recommended_food: "",
    not_recommended_food: "",
    feeding_frequency: "",
  },
  ornamental: {
    environment: "",
    population: "",
    water_temp: "",
    ph: "",
    preparation: "",
    recommended_food: "",
    feeding_frequency: "",
    feeding_amount: "",
  },
};

export default function FishForm({
  mode = "create",
  fishId,
  initialData,
}: FishFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FishPayload>(initialData || emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateGeneral = (
    key: keyof FishPayload["general"],
    value: string | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value },
    }));
  };

  const updateFarmer = (
    key: keyof NonNullable<FishPayload["farmer"]>,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      farmer: { ...prev.farmer, [key]: value },
    }));
  };

  const updateOrnamental = (
    key: keyof NonNullable<FishPayload["ornamental"]>,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      ornamental: { ...prev.ornamental, [key]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "edit" && fishId) {
        await apiFetch(`/admin/fish/${fishId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setSuccess("Fish updated successfully");
      } else {
        await apiFetch("/admin/fish", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setSuccess("Fish created successfully");
      }

      setTimeout(() => {
        router.push("/admin/fish");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>General</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.general.name}
              onChange={(e) => updateGeneral("name", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Slug</label>
            <input
              className={inputClass}
              value={form.general.slug}
              onChange={(e) => updateGeneral("slug", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <input
              className={inputClass}
              value={form.general.type || ""}
              onChange={(e) => updateGeneral("type", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <input
              className={inputClass}
              value={form.general.category || ""}
              onChange={(e) => updateGeneral("category", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Habitat</label>
            <input
              className={inputClass}
              value={form.general.habitat || ""}
              onChange={(e) => updateGeneral("habitat", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Cover Image URL</label>
            <input
              className={inputClass}
              value={form.general.cover_image_url || ""}
              onChange={(e) => updateGeneral("cover_image_url", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Average Lifespan</label>
            <input
              className={inputClass}
              value={form.general.average_lifespan || ""}
              onChange={(e) => updateGeneral("average_lifespan", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Adult Size</label>
            <input
              className={inputClass}
              value={form.general.adult_size || ""}
              onChange={(e) => updateGeneral("adult_size", e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Short Description</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.general.short_description || ""}
              onChange={(e) =>
                updateGeneral("short_description", e.target.value)
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>How to Identify</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.general.identify_text || ""}
              onChange={(e) => updateGeneral("identify_text", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.general.is_active}
              onChange={(e) => updateGeneral("is_active", e.target.checked)}
            />
            Active
          </label>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>Farmer</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>How to Raise</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.farmer?.how_to_raise || ""}
              onChange={(e) => updateFarmer("how_to_raise", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Pond Type</label>
            <input
              className={inputClass}
              value={form.farmer?.pond_type || ""}
              onChange={(e) => updateFarmer("pond_type", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Pond Size</label>
            <input
              className={inputClass}
              value={form.farmer?.pond_size || ""}
              onChange={(e) => updateFarmer("pond_size", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Population per Pond</label>
            <input
              className={inputClass}
              value={form.farmer?.population_per_pond || ""}
              onChange={(e) =>
                updateFarmer("population_per_pond", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Water Temp</label>
            <input
              className={inputClass}
              value={form.farmer?.water_temp || ""}
              onChange={(e) => updateFarmer("water_temp", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>pH</label>
            <input
              className={inputClass}
              value={form.farmer?.ph || ""}
              onChange={(e) => updateFarmer("ph", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Water Prep</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.farmer?.water_prep || ""}
              onChange={(e) => updateFarmer("water_prep", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Recommended Food</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.farmer?.recommended_food || ""}
              onChange={(e) =>
                updateFarmer("recommended_food", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Not Recommended Food</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.farmer?.not_recommended_food || ""}
              onChange={(e) =>
                updateFarmer("not_recommended_food", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Feeding Frequency</label>
            <input
              className={inputClass}
              value={form.farmer?.feeding_frequency || ""}
              onChange={(e) =>
                updateFarmer("feeding_frequency", e.target.value)
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>Ornamental</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Environment</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.ornamental?.environment || ""}
              onChange={(e) => updateOrnamental("environment", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Population</label>
            <input
              className={inputClass}
              value={form.ornamental?.population || ""}
              onChange={(e) => updateOrnamental("population", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Water Temp</label>
            <input
              className={inputClass}
              value={form.ornamental?.water_temp || ""}
              onChange={(e) => updateOrnamental("water_temp", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>pH</label>
            <input
              className={inputClass}
              value={form.ornamental?.ph || ""}
              onChange={(e) => updateOrnamental("ph", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Preparation</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.ornamental?.preparation || ""}
              onChange={(e) => updateOrnamental("preparation", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Recommended Food</label>
            <textarea
              className={inputClass}
              rows={3}
              value={form.ornamental?.recommended_food || ""}
              onChange={(e) =>
                updateOrnamental("recommended_food", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Feeding Frequency</label>
            <input
              className={inputClass}
              value={form.ornamental?.feeding_frequency || ""}
              onChange={(e) =>
                updateOrnamental("feeding_frequency", e.target.value)
              }
            />
          </div>
          <div>
            <label className={labelClass}>Feeding Amount</label>
            <input
              className={inputClass}
              value={form.ornamental?.feeding_amount || ""}
              onChange={(e) =>
                updateOrnamental("feeding_amount", e.target.value)
              }
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? mode === "edit"
              ? "Updating..."
              : "Saving..."
            : mode === "edit"
            ? "Update Fish"
            : "Save Fish"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/fish")}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}