"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createFish,
  type FishFarmerPayload,
  type FishGeneralPayload,
  type FishOrnamentalPayload,
} from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

type CreateTab = "general" | "farmer" | "ornamental";

const EMPTY_GENERAL: FishGeneralPayload = {
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
};

const EMPTY_FARMER: FishFarmerPayload = {
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
};

const EMPTY_ORNAMENTAL: FishOrnamentalPayload = {
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
};

const GENERAL_FIELDS: Array<{
  key: keyof FishGeneralPayload;
  label: string;
  textarea?: boolean;
}> = [
  { key: "name", label: "Fish Name" },
  { key: "slug", label: "Slug" },
  { key: "short_description", label: "Short Description", textarea: true },
  { key: "type", label: "Type" },
  { key: "category", label: "Category" },
  { key: "habitat", label: "Habitat", textarea: true },
  { key: "identify_text", label: "Identify Text", textarea: true },
  { key: "average_lifespan", label: "Average Lifespan" },
  { key: "adult_size", label: "Adult Size" },
  { key: "origin", label: "Origin" },
  { key: "cover_image_url", label: "Cover Image URL", textarea: true },
];

const FARMER_FIELDS: Array<{
  key: keyof FishFarmerPayload;
  label: string;
  textarea?: boolean;
}> = [
  { key: "how_to_raise", label: "How to Raise", textarea: true },
  { key: "pond_type", label: "Pond Type" },
  { key: "pond_size", label: "Pond Size" },
  { key: "population_per_pond", label: "Population per Pond" },
  { key: "water_temp", label: "Water Temperature" },
  { key: "ph", label: "pH" },
  { key: "water_prep", label: "Water Preparation", textarea: true },
  { key: "recommended_food", label: "Recommended Food", textarea: true },
  { key: "not_recommended_food", label: "Not Recommended Food", textarea: true },
  { key: "feeding_frequency", label: "Feeding Frequency" },
  { key: "feeding_amount", label: "Feeding Amount" },
  { key: "compatible_species", label: "Compatible Species", textarea: true },
  { key: "growth_rate", label: "Growth Rate" },
  { key: "common_diseases", label: "Common Diseases", textarea: true },
  { key: "disease_prevention", label: "Disease Prevention", textarea: true },
  { key: "source_type", label: "Source Type" },
  { key: "source_size", label: "Source Size" },
  { key: "system_type", label: "System Type" },
  { key: "incompatible_species", label: "Incompatible Species", textarea: true },
  { key: "survival_rate", label: "Survival Rate" },
  { key: "notes", label: "Notes", textarea: true },
];

const ORNAMENTAL_FIELDS: Array<{
  key: keyof FishOrnamentalPayload;
  label: string;
  textarea?: boolean;
}> = [
  { key: "environment", label: "Environment", textarea: true },
  { key: "population", label: "Population" },
  { key: "water_temp", label: "Water Temperature" },
  { key: "ph", label: "pH" },
  { key: "preparation", label: "Preparation", textarea: true },
  { key: "recommended_food", label: "Recommended Food", textarea: true },
  { key: "feeding_frequency", label: "Feeding Frequency" },
  { key: "feeding_amount", label: "Feeding Amount" },
  { key: "source_type", label: "Source Type" },
  { key: "source_size", label: "Source Size" },
  { key: "compatible_species", label: "Compatible Species", textarea: true },
  { key: "growth_rate", label: "Growth Rate" },
  { key: "common_diseases", label: "Common Diseases", textarea: true },
  { key: "disease_prevention", label: "Disease Prevention", textarea: true },
  { key: "system_type", label: "System Type" },
  { key: "incompatible_species", label: "Incompatible Species", textarea: true },
  { key: "survival_rate", label: "Survival Rate" },
  { key: "not_recommended_food", label: "Not Recommended Food", textarea: true },
  { key: "notes", label: "Notes", textarea: true },
];

export default function AdminFishNewPage() {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();

  const [tab, setTab] = useState<CreateTab>("general");

  const [general, setGeneral] = useState<FishGeneralPayload>(EMPTY_GENERAL);
  const [farmer, setFarmer] = useState<FishFarmerPayload>(EMPTY_FARMER);
  const [ornamental, setOrnamental] =
    useState<FishOrnamentalPayload>(EMPTY_ORNAMENTAL);

  const [isSaving, setIsSaving] = useState(false);

  const pageTitle = useMemo(() => {
    return general.name.trim() ? `Create ${general.name.trim()}` : "Create New Fish";
  }, [general.name]);

  function updateGeneralField<K extends keyof FishGeneralPayload>(
    key: K,
    value: FishGeneralPayload[K]
  ) {
    setGeneral((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateFarmerField<K extends keyof FishFarmerPayload>(
    key: K,
    value: FishFarmerPayload[K]
  ) {
    setFarmer((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateOrnamentalField<K extends keyof FishOrnamentalPayload>(
    key: K,
    value: FishOrnamentalPayload[K]
  ) {
    setOrnamental((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setGeneral(EMPTY_GENERAL);
    setFarmer(EMPTY_FARMER);
    setOrnamental(EMPTY_ORNAMENTAL);
    setTab("general");
  }

  function normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function extractCreatedFishId(response: unknown): number | null {
    if (!response || typeof response !== "object") return null;

    const obj = response as Record<string, unknown>;
    const data = obj.data;

    if (data && typeof data === "object") {
      const detail = data as Record<string, unknown>;
      const fish = detail.fish;

      if (fish && typeof fish === "object") {
        const fishObj = fish as Record<string, unknown>;
        const id = fishObj.id;

        if (typeof id === "number") return id;
      }
    }

    return null;
  }

  async function handleCreate() {
    if (!general.name.trim()) {
      setTab("general");
      showWarning("Fish name is required.");
      return;
    }

    if (!general.slug.trim()) {
      setTab("general");
      showWarning("Slug is required.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await createFish({
        general: {
          ...general,
          name: general.name.trim(),
          slug: normalizeSlug(general.slug),
        },
        farmer,
        ornamental,
      });

      const createdId = extractCreatedFishId(response);

      showSuccess("Fish created successfully.");

      if (createdId) {
        router.push(`/admin/fish/${createdId}/edit`);
        router.refresh();
        return;
      }

      resetForm();
    } catch (error) {
      console.error("Failed to create fish:", error);
      showError(
        error instanceof Error ? error.message : "Failed to create fish."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Admin</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
              {pageTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Create a new fish record first, then continue to the edit page to
              manage gallery images and cover image.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/fish"
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Back to Fish Management
            </Link>

            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Reset Form
            </button>

            <button
              type="button"
              onClick={handleCreate}
              disabled={isSaving}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Creating..." : "Create Fish"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
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
        </div>
      </section>

      {tab === "general" ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            {GENERAL_FIELDS.map((field) => (
              <FieldRenderer
                key={String(field.key)}
                label={field.label}
                value={String(general[field.key] ?? "")}
                textarea={field.textarea}
                onChange={(value) =>
                  updateGeneralField(field.key, value as never)
                }
              />
            ))}

            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(general.is_active)}
                  onChange={(event) =>
                    updateGeneralField("is_active", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />
                Publish this fish in public catalog
              </label>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-4 md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Slug Tip
              </p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    updateGeneralField("slug", normalizeSlug(general.name))
                  }
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  Generate slug from name
                </button>

                <p className="text-sm text-slate-600">
                  Example: <span className="font-semibold">tilapia-nile</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "farmer" ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            {FARMER_FIELDS.map((field) => (
              <FieldRenderer
                key={String(field.key)}
                label={field.label}
                value={String(farmer[field.key] ?? "")}
                textarea={field.textarea}
                onChange={(value) =>
                  updateFarmerField(field.key, value as never)
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {tab === "ornamental" ? (
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-5 md:grid-cols-2">
            {ORNAMENTAL_FIELDS.map((field) => (
              <FieldRenderer
                key={String(field.key)}
                label={field.label}
                value={String(ornamental[field.key] ?? "")}
                textarea={field.textarea}
                onChange={(value) =>
                  updateOrnamentalField(field.key, value as never)
                }
              />
            ))}
          </div>
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

function FieldRenderer({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      )}
    </div>
  );
}