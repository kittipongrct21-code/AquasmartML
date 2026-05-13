"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  FishImageItem,
  addFishImage,
  deleteFishImage,
  getFishImages,
  setFishImageCover,
  uploadImage,
} from "@/lib/api";

type FishGalleryManagerProps = {
  fishId: string | number;
};

export default function FishGalleryManager({ fishId }: FishGalleryManagerProps) {
  const [images, setImages] = useState<FishImageItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [setUploadedAsCover, setSetUploadedAsCover] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadImages() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getFishImages(fishId);
      setImages(data);
    } catch (error) {
      console.warn("Load fish images warning:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load fish images."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleUploadImage() {
    if (!selectedFile) {
      setErrorMessage("Please choose an image first.");
      return;
    }

    try {
      setIsUploading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const uploaded = await uploadImage(selectedFile);

      if (!uploaded.public_url) {
        throw new Error("Upload succeeded but public_url is missing.");
      }

      await addFishImage(fishId, {
        image_url: uploaded.public_url,
        alt_text: "Fish image",
        is_cover: setUploadedAsCover,
      });

      setSelectedFile(null);
      setSetUploadedAsCover(false);
      setSuccessMessage("Image uploaded successfully.");

      await loadImages();
    } catch (error) {
      console.warn("Upload fish image warning:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSetCover(imageId: number) {
    try {
      setIsMutating(true);
      setErrorMessage("");
      setSuccessMessage("");

      await setFishImageCover(imageId);

      setSuccessMessage("Cover image updated successfully.");
      await loadImages();
    } catch (error) {
      console.warn("Set cover warning:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to set cover image."
      );
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteImage(imageId: number) {
    const confirmed = window.confirm("Delete this image?");
    if (!confirmed) return;

    try {
      setIsMutating(true);
      setErrorMessage("");
      setSuccessMessage("");

      await deleteFishImage(imageId);

      setSuccessMessage("Image deleted successfully.");
      await loadImages();
    } catch (error) {
      console.warn("Delete fish image warning:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete image."
      );
    } finally {
      setIsMutating(false);
    }
  }

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fishId]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Fish Gallery</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Upload fish images and choose one image as the cover.
        </p>
      </div>

      <div className="mt-5 rounded-3xl bg-slate-50 p-5">
        <label className="block text-sm font-medium text-slate-700">
          Upload Image
        </label>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />

          <button
            type="button"
            onClick={handleUploadImage}
            disabled={!selectedFile || isUploading}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </button>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={setUploadedAsCover}
            onChange={(event) => setSetUploadedAsCover(event.target.checked)}
            className="h-4 w-4"
          />
          Set uploaded image as cover
        </label>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          Loading gallery...
        </div>
      ) : null}

      {!isLoading && images.length === 0 ? (
        <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
          No images yet.
        </div>
      ) : null}

      {!isLoading && images.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <article
              key={image.id}
              className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
            >
              <div className="relative h-56 bg-slate-100">
                <Image
                  src={image.image_url}
                  alt={image.alt_text || "Fish image"}
                  fill
                  className="object-contain p-3"
                  unoptimized
                />

                {image.is_cover ? (
                  <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                    Cover
                  </span>
                ) : null}
              </div>

              <div className="p-4">
                <p className="text-sm font-medium text-slate-700">
                  {image.alt_text || "Fish image"}
                </p>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetCover(image.id)}
                    disabled={isMutating || image.is_cover}
                    className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Set Cover
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteImage(image.id)}
                    disabled={isMutating}
                    className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}