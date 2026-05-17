"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  addFishImage,
  deleteFishImage,
  getAdminFishById,
  getFishImages,
  setFishImageCover,
  updateFish,
  uploadImage,
  type FishFarmerPayload,
  type FishGeneralPayload,
  type FishImageItem,
  type FishOrnamentalPayload,
} from "@/lib/api";
import { useToast } from "@/components/providers/ToastProvider";

type EditTab = "general" | "farmer" | "ornamental" | "gallery";

const EMPTY_GENERAL: FishGeneralPayload = {
  name: "",
  name_th: "",
  slug: "",
  short_description: "",
  short_description_th: "",
  type: "",
  type_th: "",
  category: "",
  category_th: "",
  habitat: "",
  habitat_th: "",
  identify_text: "",
  identify_text_th: "",
  average_lifespan: "",
  average_lifespan_th: "",
  adult_size: "",
  adult_size_th: "",
  cover_image_url: "",
  is_active: true,
  origin: "",
  origin_th: "",
};

const EMPTY_FARMER: FishFarmerPayload = {
  how_to_raise: "",
  how_to_raise_th: "",
  pond_type: "",
  pond_type_th: "",
  pond_size: "",
  pond_size_th: "",
  population_per_pond: "",
  population_per_pond_th: "",
  water_temp: "",
  water_temp_th: "",
  ph: "",
  ph_th: "",
  water_prep: "",
  water_prep_th: "",
  recommended_food: "",
  recommended_food_th: "",
  not_recommended_food: "",
  not_recommended_food_th: "",
  feeding_frequency: "",
  feeding_frequency_th: "",
  feeding_amount: "",
  feeding_amount_th: "",
  compatible_species: "",
  compatible_species_th: "",
  growth_rate: "",
  growth_rate_th: "",
  common_diseases: "",
  common_diseases_th: "",
  disease_prevention: "",
  disease_prevention_th: "",
  source_type: "",
  source_type_th: "",
  source_size: "",
  source_size_th: "",
  system_type: "",
  system_type_th: "",
  incompatible_species: "",
  incompatible_species_th: "",
  survival_rate: "",
  survival_rate_th: "",
  notes: "",
  notes_th: "",
};

const EMPTY_ORNAMENTAL: FishOrnamentalPayload = {
  environment: "",
  environment_th: "",
  population: "",
  population_th: "",
  water_temp: "",
  water_temp_th: "",
  ph: "",
  ph_th: "",
  preparation: "",
  preparation_th: "",
  recommended_food: "",
  recommended_food_th: "",
  feeding_frequency: "",
  feeding_frequency_th: "",
  feeding_amount: "",
  feeding_amount_th: "",
  source_type: "",
  source_type_th: "",
  source_size: "",
  source_size_th: "",
  compatible_species: "",
  compatible_species_th: "",
  growth_rate: "",
  growth_rate_th: "",
  common_diseases: "",
  common_diseases_th: "",
  disease_prevention: "",
  disease_prevention_th: "",
  system_type: "",
  system_type_th: "",
  incompatible_species: "",
  incompatible_species_th: "",
  survival_rate: "",
  survival_rate_th: "",
  not_recommended_food: "",
  not_recommended_food_th: "",
  notes: "",
  notes_th: "",
};

const GENERAL_FIELDS: Array<{
  key: keyof FishGeneralPayload;
  label: string;
  textarea?: boolean;
}> = [
  { key: "name", label: "Fish Name" },
  { key: "name_th", label: "Fish Name (Thai)" },
  { key: "slug", label: "Slug" },
  { key: "short_description", label: "Short Description", textarea: true },
  { key: "short_description_th", label: "Short Description (Thai)", textarea: true },
  { key: "type", label: "Type" },
  { key: "type_th", label: "Type (Thai)" },
  { key: "category", label: "Category" },
  { key: "category_th", label: "Category (Thai)" },
  { key: "habitat", label: "Habitat", textarea: true },
  { key: "habitat_th", label: "Habitat (Thai)", textarea: true },
  { key: "identify_text", label: "Identify Text", textarea: true },
  { key: "identify_text_th", label: "Identify Text (Thai)", textarea: true },
  { key: "average_lifespan", label: "Average Lifespan" },
  { key: "average_lifespan_th", label: "Average Lifespan (Thai)" },
  { key: "adult_size", label: "Adult Size" },
  { key: "adult_size_th", label: "Adult Size (Thai)" },
  { key: "origin", label: "Origin" },
  { key: "origin_th", label: "Origin (Thai)" },
  { key: "cover_image_url", label: "Cover Image URL", textarea: true },
];

const FARMER_FIELDS: Array<{
  key: keyof FishFarmerPayload;
  label: string;
  textarea?: boolean;
}> = [
  { key: "how_to_raise", label: "How to Raise", textarea: true },
  { key: "how_to_raise_th", label: "How to Raise (Thai)", textarea: true },
  { key: "pond_type", label: "Pond Type" },
  { key: "pond_type_th", label: "Pond Type (Thai)" },
  { key: "pond_size", label: "Pond Size" },
  { key: "pond_size_th", label: "Pond Size (Thai)" },
  { key: "population_per_pond", label: "Population per Pond" },
  { key: "population_per_pond_th", label: "Population per Pond (Thai)" },
  { key: "water_temp", label: "Water Temperature" },
  { key: "water_temp_th", label: "Water Temperature (Thai)" },
  { key: "ph", label: "pH" },
  { key: "ph_th", label: "pH (Thai)" },
  { key: "water_prep", label: "Water Preparation", textarea: true },
  { key: "water_prep_th", label: "Water Preparation (Thai)", textarea: true },
  { key: "recommended_food", label: "Recommended Food", textarea: true },
  { key: "recommended_food_th", label: "Recommended Food (Thai)", textarea: true },
  { key: "not_recommended_food", label: "Not Recommended Food", textarea: true },
  { key: "not_recommended_food_th", label: "Not Recommended Food (Thai)", textarea: true },
  { key: "feeding_frequency", label: "Feeding Frequency" },
  { key: "feeding_frequency_th", label: "Feeding Frequency (Thai)" },
  { key: "feeding_amount", label: "Feeding Amount" },
  { key: "feeding_amount_th", label: "Feeding Amount (Thai)" },
  { key: "compatible_species", label: "Compatible Species", textarea: true },
  { key: "compatible_species_th", label: "Compatible Species (Thai)", textarea: true },
  { key: "growth_rate", label: "Growth Rate" },
  { key: "growth_rate_th", label: "Growth Rate (Thai)" },
  { key: "common_diseases", label: "Common Diseases", textarea: true },
  { key: "common_diseases_th", label: "Common Diseases (Thai)", textarea: true },
  { key: "disease_prevention", label: "Disease Prevention", textarea: true },
  { key: "disease_prevention_th", label: "Disease Prevention (Thai)", textarea: true },
  { key: "source_type", label: "Source Type" },
  { key: "source_type_th", label: "Source Type (Thai)" },
  { key: "source_size", label: "Source Size" },
  { key: "source_size_th", label: "Source Size (Thai)" },
  { key: "system_type", label: "System Type" },
  { key: "system_type_th", label: "System Type (Thai)" },
  { key: "incompatible_species", label: "Incompatible Species", textarea: true },
  { key: "incompatible_species_th", label: "Incompatible Species (Thai)", textarea: true },
  { key: "survival_rate", label: "Survival Rate" },
  { key: "survival_rate_th", label: "Survival Rate (Thai)" },
  { key: "notes", label: "Notes", textarea: true },
  { key: "notes_th", label: "Notes (Thai)", textarea: true },
];

const ORNAMENTAL_FIELDS: Array<{
  key: keyof FishOrnamentalPayload;
  label: string;
  textarea?: boolean;
}> = [
  { key: "environment", label: "Environment", textarea: true },
  { key: "environment_th", label: "Environment (Thai)", textarea: true },
  { key: "population", label: "Population" },
  { key: "population_th", label: "Population (Thai)" },
  { key: "water_temp", label: "Water Temperature" },
  { key: "water_temp_th", label: "Water Temperature (Thai)" },
  { key: "ph", label: "pH" },
  { key: "ph_th", label: "pH (Thai)" },
  { key: "preparation", label: "Preparation", textarea: true },
  { key: "preparation_th", label: "Preparation (Thai)", textarea: true },
  { key: "recommended_food", label: "Recommended Food", textarea: true },
  { key: "recommended_food_th", label: "Recommended Food (Thai)", textarea: true },
  { key: "feeding_frequency", label: "Feeding Frequency" },
  { key: "feeding_frequency_th", label: "Feeding Frequency (Thai)" },
  { key: "feeding_amount", label: "Feeding Amount" },
  { key: "feeding_amount_th", label: "Feeding Amount (Thai)" },
  { key: "source_type", label: "Source Type" },
  { key: "source_type_th", label: "Source Type (Thai)" },
  { key: "source_size", label: "Source Size" },
  { key: "source_size_th", label: "Source Size (Thai)" },
  { key: "compatible_species", label: "Compatible Species", textarea: true },
  { key: "compatible_species_th", label: "Compatible Species (Thai)", textarea: true },
  { key: "growth_rate", label: "Growth Rate" },
  { key: "growth_rate_th", label: "Growth Rate (Thai)" },
  { key: "common_diseases", label: "Common Diseases", textarea: true },
  { key: "common_diseases_th", label: "Common Diseases (Thai)", textarea: true },
  { key: "disease_prevention", label: "Disease Prevention", textarea: true },
  { key: "disease_prevention_th", label: "Disease Prevention (Thai)", textarea: true },
  { key: "system_type", label: "System Type" },
  { key: "system_type_th", label: "System Type (Thai)" },
  { key: "incompatible_species", label: "Incompatible Species", textarea: true },
  { key: "incompatible_species_th", label: "Incompatible Species (Thai)", textarea: true },
  { key: "survival_rate", label: "Survival Rate" },
  { key: "survival_rate_th", label: "Survival Rate (Thai)" },
  { key: "not_recommended_food", label: "Not Recommended Food", textarea: true },
  { key: "not_recommended_food_th", label: "Not Recommended Food (Thai)", textarea: true },
  { key: "notes", label: "Notes", textarea: true },
  { key: "notes_th", label: "Notes (Thai)", textarea: true },
];

export default function AdminFishEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();

  const fishId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const missingFishId = !fishId;

  const [tab, setTab] = useState<EditTab>("general");

  const [general, setGeneral] = useState<FishGeneralPayload>(EMPTY_GENERAL);
  const [farmer, setFarmer] = useState<FishFarmerPayload>(EMPTY_FARMER);
  const [ornamental, setOrnamental] =
    useState<FishOrnamentalPayload>(EMPTY_ORNAMENTAL);

  const [images, setImages] = useState<FishImageItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [setUploadedAsCover, setSetUploadedAsCover] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMutatingImage, setIsMutatingImage] = useState(false);

  const [pageError, setPageError] = useState("");

  const pageTitle = useMemo(() => {
    return general.name ? `Edit ${general.name}` : "Edit Fish";
  }, [general.name]);

  useEffect(() => {
    if (!fishId) return;

    let isMounted = true;

    async function loadFishDetail() {
      try {
        setIsLoading(true);
        setPageError("");

        const [detail, gallery] = await Promise.all([
          getAdminFishById(fishId),
          getFishImages(fishId),
        ]);

        if (!isMounted) return;

        const detailObject = detail as {
          fish?: FishGeneralPayload | null;
          farmer_info?: FishFarmerPayload | null;
          ornamental_info?: FishOrnamentalPayload | null;
        };

        setGeneral({
          ...EMPTY_GENERAL,
          ...(detailObject.fish || {}),
        });

        setFarmer({
          ...EMPTY_FARMER,
          ...(detailObject.farmer_info || {}),
        });

        setOrnamental({
          ...EMPTY_ORNAMENTAL,
          ...(detailObject.ornamental_info || {}),
        });

        setImages(gallery || []);
      } catch (error) {
        console.error("Failed to load fish edit data:", error);

        if (!isMounted) return;

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load fish detail.";

        setPageError(message);
        showError(message);
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
  }, [fishId, showError]);

  function normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

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

  async function refreshImages() {
    if (!fishId) return;
    const gallery = await getFishImages(fishId);
    setImages(gallery || []);
  }

  async function handleSave() {
    if (!fishId) {
      showWarning("Fish ID is missing.");
      return;
    }

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

      await updateFish(fishId, {
        general: {
          ...general,
          name: general.name.trim(),
          slug: normalizeSlug(general.slug),
        },
        farmer,
        ornamental,
      });

      showSuccess("Fish updated successfully.");
      router.refresh();
    } catch (error) {
      console.error("Failed to update fish:", error);
      showError(
        error instanceof Error ? error.message : "Failed to update fish."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadImage() {
    if (!fishId) {
      showWarning("Fish ID is missing.");
      return;
    }

    if (!selectedFile) {
      showWarning("Please choose an image first.");
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      showWarning("Please upload an image file.");
      return;
    }

    try {
      setIsUploadingImage(true);

      const uploaded = await uploadImage(selectedFile);

      await addFishImage(fishId, {
        image_url: uploaded.public_url,
        alt_text: `${general.name || "Fish"} image`,
        is_cover: setUploadedAsCover,
      });

      setSelectedFile(null);
      setSetUploadedAsCover(false);
      await refreshImages();

      if (setUploadedAsCover) {
        setGeneral((prev) => ({
          ...prev,
          cover_image_url: uploaded.public_url,
        }));
      }

      showSuccess("Image uploaded successfully.");
      setTab("gallery");
    } catch (error) {
      console.error("Failed to upload fish image:", error);
      showError(
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSetCover(imageId: number, imageUrl: string) {
    try {
      setIsMutatingImage(true);

      await setFishImageCover(imageId);
      await refreshImages();

      setGeneral((prev) => ({
        ...prev,
        cover_image_url: imageUrl,
      }));

      showSuccess("Cover image updated successfully.");
    } catch (error) {
      console.error("Failed to set cover image:", error);
      showError(
        error instanceof Error ? error.message : "Failed to set cover image."
      );
    } finally {
      setIsMutatingImage(false);
    }
  }

  async function handleDeleteImage(imageId: number, imageUrl: string) {
    const confirmed = window.confirm(
      "Delete this image?\n\nIf this is the current cover, another image may become the new cover automatically."
    );

    if (!confirmed) return;

    try {
      setIsMutatingImage(true);

      await deleteFishImage(imageId);
      await refreshImages();

      if (general.cover_image_url === imageUrl) {
        setGeneral((prev) => ({
          ...prev,
          cover_image_url: "",
        }));
      }

      showSuccess("Image deleted successfully.");
    } catch (error) {
      console.error("Failed to delete fish image:", error);
      showError(
        error instanceof Error ? error.message : "Failed to delete image."
      );
    } finally {
      setIsMutatingImage(false);
    }
  }

  if (isLoading && !missingFishId) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">Loading fish edit page...</p>
      </section>
    );
  }

  if (missingFishId || pageError) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-600">Admin</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                Edit Fish
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
            {missingFishId ? "Fish ID is missing." : pageError}
          </div>
        </div>
      </section>
    );
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
              Update fish information, manage the cover image, and maintain the
              image gallery from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/fish"
              className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Back to Fish Management
            </Link>

            <Link
              href={`/admin/fish/${fishId}`}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              View Detail
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Saving..." : "Save Changes"}
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
          <TabButton
            active={tab === "gallery"}
            label="Gallery"
            onClick={() => setTab("gallery")}
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

      {tab === "gallery" ? (
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Upload New Image</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label
                  htmlFor="gallery-file"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Choose Image
                </label>
                <input
                  id="gallery-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] ?? null)
                  }
                  className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={!selectedFile || isUploadingImage}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isUploadingImage ? "Uploading..." : "Upload Image"}
                </button>
              </div>
            </div>

            <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={setUploadedAsCover}
                onChange={(event) => setSetUploadedAsCover(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Set uploaded image as cover
            </label>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Fish Gallery</h2>

              <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                {images.length} image{images.length === 1 ? "" : "s"}
              </div>
            </div>

            {images.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                No images uploaded yet.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {images.map((image) => (
                  <article
                    key={image.id}
                    className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="flex h-56 items-center justify-center overflow-hidden bg-slate-50">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || general.name || "Fish image"}
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

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSetCover(image.id, image.image_url)
                          }
                          disabled={isMutatingImage}
                          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Set Cover
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteImage(image.id, image.image_url)
                          }
                          disabled={isMutatingImage}
                          className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
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
