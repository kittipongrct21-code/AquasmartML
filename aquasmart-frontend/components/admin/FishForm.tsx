"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createFish, updateFish, uploadImage } from "@/lib/api";
import { FishPayload } from "@/types/fish";

type FishFormProps = {
  mode?: "create" | "edit";
  fishId?: number;
  initialData?: FishPayload;
  coverImageOverride?: string;
  onCoverImageChange?: (url: string) => void;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500";
const textareaClass =
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
    origin: "",
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
    feeding_amount: "",
    compatible_species: "",
    growth_rate: "",
    common_diseases: "",
    disease_prevention: "",
    source_type: "",
    source_size: "",
    system_type: "",
    incompatible_species: "",
    survival_rate: "",
    notes: "",
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
    source_type: "",
    source_size: "",
    compatible_species: "",
    growth_rate: "",
    common_diseases: "",
    disease_prevention: "",
    system_type: "",
    incompatible_species: "",
    survival_rate: "",
    not_recommended_food: "",
    notes: "",
  },
};

export default function FishForm({
  mode = "create",
  fishId,
  initialData,
  coverImageOverride,
  onCoverImageChange,
}: FishFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FishPayload>(initialData || emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        general: {
          ...emptyData.general,
          ...initialData.general,
        },
        farmer: {
          ...emptyData.farmer,
          ...initialData.farmer,
        },
        ornamental: {
          ...emptyData.ornamental,
          ...initialData.ornamental,
        },
      });
    }
  }, [initialData]);

  useEffect(() => {
    if (typeof coverImageOverride === "string") {
      setForm((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          cover_image_url: coverImageOverride,
        },
      }));
    }
  }, [coverImageOverride]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setSuccess("");

    try {
      setUploadingImage(true);
      const result = await uploadImage(selectedFile);

      setForm((prev) => ({
        ...prev,
        general: {
          ...prev.general,
          cover_image_url: result.public_url,
        },
      }));

      onCoverImageChange?.(result.public_url);
      setSuccess("Image uploaded successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "edit" && fishId) {
        await updateFish(fishId, form);
        setSuccess("Fish updated successfully");
      } else {
        await createFish(form);
        setSuccess("Fish created successfully");
      }

      setTimeout(() => {
        router.push("/admin/fish");
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>General Information</h2>

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
            <label className={labelClass}>Origin</label>
            <input
              className={inputClass}
              value={form.general.origin || ""}
              onChange={(e) => updateGeneral("origin", e.target.value)}
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
              className={textareaClass}
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
              className={textareaClass}
              rows={3}
              value={form.general.identify_text || ""}
              onChange={(e) => updateGeneral("identify_text", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Cover Image URL</label>
            <input
              className={inputClass}
              value={form.general.cover_image_url || ""}
              onChange={(e) => {
                updateGeneral("cover_image_url", e.target.value);
                onCoverImageChange?.(e.target.value);
              }}
              placeholder="https://..."
            />

            <div className="mt-3">
              <label className={labelClass}>Upload Cover Image</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageUpload}
                className="block w-full text-sm text-slate-600"
              />
              <p className="mt-2 text-xs text-slate-500">
                Allowed: JPG, PNG, WEBP
              </p>
              {uploadingImage ? (
                <p className="mt-2 text-sm text-blue-600">Uploading image...</p>
              ) : null}
            </div>

            {form.general.cover_image_url ? (
              <div className="mt-4">
                <img
                  src={form.general.cover_image_url}
                  alt="Preview"
                  className="h-32 w-48 rounded-xl border border-slate-200 object-cover"
                />
              </div>
            ) : null}
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
        <h2 className={sectionTitleClass}>Farmer Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>How to Raise</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.how_to_raise || ""}
              onChange={(e) => updateFarmer("how_to_raise", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Source Type</label>
            <input
              className={inputClass}
              value={form.farmer?.source_type || ""}
              onChange={(e) => updateFarmer("source_type", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Source Size</label>
            <input
              className={inputClass}
              value={form.farmer?.source_size || ""}
              onChange={(e) => updateFarmer("source_size", e.target.value)}
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
            <label className={labelClass}>System Type</label>
            <input
              className={inputClass}
              value={form.farmer?.system_type || ""}
              onChange={(e) => updateFarmer("system_type", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Compatible Species</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.compatible_species || ""}
              onChange={(e) =>
                updateFarmer("compatible_species", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Incompatible Species</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.incompatible_species || ""}
              onChange={(e) =>
                updateFarmer("incompatible_species", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Water Temperature</label>
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

          <div className="md:col-span-2">
            <label className={labelClass}>Water Preparation</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.water_prep || ""}
              onChange={(e) => updateFarmer("water_prep", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Growth Rate</label>
            <input
              className={inputClass}
              value={form.farmer?.growth_rate || ""}
              onChange={(e) => updateFarmer("growth_rate", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Survival Rate</label>
            <input
              className={inputClass}
              value={form.farmer?.survival_rate || ""}
              onChange={(e) => updateFarmer("survival_rate", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Recommended Food</label>
            <textarea
              className={textareaClass}
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
              className={textareaClass}
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

          <div>
            <label className={labelClass}>Feeding Amount</label>
            <input
              className={inputClass}
              value={form.farmer?.feeding_amount || ""}
              onChange={(e) => updateFarmer("feeding_amount", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Common Diseases</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.common_diseases || ""}
              onChange={(e) => updateFarmer("common_diseases", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Disease Prevention</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.disease_prevention || ""}
              onChange={(e) =>
                updateFarmer("disease_prevention", e.target.value)
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.farmer?.notes || ""}
              onChange={(e) => updateFarmer("notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className={sectionTitleClass}>Ornamental Information</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Environment</label>
            <textarea
              className={textareaClass}
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
            <label className={labelClass}>Source Type</label>
            <input
              className={inputClass}
              value={form.ornamental?.source_type || ""}
              onChange={(e) => updateOrnamental("source_type", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Source Size</label>
            <input
              className={inputClass}
              value={form.ornamental?.source_size || ""}
              onChange={(e) => updateOrnamental("source_size", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>System Type</label>
            <input
              className={inputClass}
              value={form.ornamental?.system_type || ""}
              onChange={(e) => updateOrnamental("system_type", e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Water Temperature</label>
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
            <label className={labelClass}>Growth Rate</label>
            <input
              className={inputClass}
              value={form.ornamental?.growth_rate || ""}
              onChange={(e) =>
                updateOrnamental("growth_rate", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Survival Rate</label>
            <input
              className={inputClass}
              value={form.ornamental?.survival_rate || ""}
              onChange={(e) =>
                updateOrnamental("survival_rate", e.target.value)
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Preparation</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.preparation || ""}
              onChange={(e) =>
                updateOrnamental("preparation", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Compatible Species</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.compatible_species || ""}
              onChange={(e) =>
                updateOrnamental("compatible_species", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Incompatible Species</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.incompatible_species || ""}
              onChange={(e) =>
                updateOrnamental("incompatible_species", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Recommended Food</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.recommended_food || ""}
              onChange={(e) =>
                updateOrnamental("recommended_food", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Not Recommended Food</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.not_recommended_food || ""}
              onChange={(e) =>
                updateOrnamental("not_recommended_food", e.target.value)
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

          <div>
            <label className={labelClass}>Common Diseases</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.common_diseases || ""}
              onChange={(e) =>
                updateOrnamental("common_diseases", e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Disease Prevention</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.disease_prevention || ""}
              onChange={(e) =>
                updateOrnamental("disease_prevention", e.target.value)
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea
              className={textareaClass}
              rows={3}
              value={form.ornamental?.notes || ""}
              onChange={(e) => updateOrnamental("notes", e.target.value)}
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