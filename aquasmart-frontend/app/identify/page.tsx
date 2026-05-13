"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPublicFishList, type FishListItem } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";

type PredictionResponse = {
  status?: string;
  predicted_class: string;
  raw_predicted_class?: string | null;
  confidence_percent?: number | null;
  prediction_type?: string | null;
  image_url?: string | null;
  uploaded_image_url?: string | null;
};

type SessionUser = {
  id: string;
  email?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function IdentifyPage() {
  const router = useRouter();

  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [fishList, setFishList] = useState<FishListItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [matchedFish, setMatchedFish] = useState<FishListItem | null>(null);

  const [isLoadingFish, setIsLoadingFish] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setIsLoadingFish(true);
        setErrorMessage("");

        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user ?? null;

        if (!isMounted) return;

        setSessionUser(
          user
            ? {
                id: user.id,
                email: user.email ?? null,
              }
            : null
        );

        const data = await getPublicFishList();

        if (!isMounted) return;
        setFishList(data || []);
      } catch (error) {
        console.error("Identify bootstrap error:", error);
        if (!isMounted) return;
        setFishList([]);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load fish data."
        );
      } finally {
        if (isMounted) {
          setIsLoadingFish(false);
        }
      }
    }

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setSessionUser(
        user
          ? {
              id: user.id,
              email: user.email ?? null,
            }
          : null
      );
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const confidencePercent = useMemo(() => {
    if (!prediction) return 0;
    return Math.max(0, Math.min(100, prediction.confidence_percent || 0));
  }, [prediction]);

  const displayName = useMemo(() => {
    if (!prediction) return "";

    if (prediction.predicted_class === "unknown_fish") {
      return "Unknown fish";
    }

    if (prediction.predicted_class === "not_a_fish") {
      return "Not a fish";
    }

    return prediction.raw_predicted_class || prediction.predicted_class;
  }, [prediction]);

  const resultVariant = useMemo(() => {
    if (!prediction) return "empty";

    if (prediction.predicted_class === "unknown_fish") return "unknown";
    if (prediction.predicted_class === "not_a_fish") return "not_fish";
    return "known";
  }, [prediction]);

  function resetPredictionState() {
    setPrediction(null);
    setMatchedFish(null);
    setErrorMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    resetPredictionState();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      setErrorMessage("Please upload an image file.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function runPredictionRequest(
    file: File,
    userId?: string
  ): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (userId) {
      formData.append("user_id", userId);
    }

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    let json: PredictionResponse | { detail?: string };

    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(text || "Prediction failed.");
    }

    if (!response.ok) {
      const detail =
        typeof json === "object" && json && "detail" in json
          ? json.detail
          : null;

      throw new Error(detail || "Prediction failed.");
    }

    return json as PredictionResponse;
  }

  function findFishMatch(
    source: FishListItem[],
    label?: string | null
  ): FishListItem | null {
    if (!label) return null;

    const normalize = (value?: string | null) =>
      (value || "")
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ");

    const target = normalize(label);
    if (!target) return null;

    for (const fish of source) {
      if (normalize(fish.name) === target) return fish;
      if (normalize(fish.slug) === target) return fish;
    }

    for (const fish of source) {
      if (normalize(fish.name).includes(target)) return fish;
      if (normalize(fish.slug).includes(target)) return fish;
    }

    return null;
  }

  async function handlePredict() {
    if (!selectedFile) {
      setErrorMessage("Please select an image first.");
      return;
    }

    try {
      setIsPredicting(true);
      setErrorMessage("");
      setPrediction(null);
      setMatchedFish(null);

      const result = await runPredictionRequest(
        selectedFile,
        sessionUser?.id || undefined
      );

      setPrediction(result);

      const rawName = result.raw_predicted_class || result.predicted_class;
      const fish = findFishMatch(fishList, rawName);
      setMatchedFish(fish);
    } catch (error) {
      console.error("Prediction error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Prediction failed."
      );
    } finally {
      setIsPredicting(false);
    }
  }

  function handleClearImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setPrediction(null);
    setMatchedFish(null);
    setErrorMessage("");
  }

  function handleOpenFullDetails() {
    if (!matchedFish) return;
    router.push(`/fish/${matchedFish.id}`);
  }

  function handleSignInForHistory() {
    router.push("/profile");
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">AI Identify</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                Identify Fish from Image
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Upload a fish image to run the model and compare the result with
                the fish catalog.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/fish"
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Browse Catalog
              </Link>
              <Link
                href="/history"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                View History
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-3xl bg-slate-100">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Selected fish"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="px-6 py-10 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-700">
                      AS
                    </div>
                    <p className="mt-4 text-sm font-semibold text-slate-700">
                      Select fish image
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG, or WEBP supported
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <label
                  htmlFor="identify-file"
                  className="inline-flex cursor-pointer rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Choose Image
                </label>

                <button
                  type="button"
                  onClick={handleClearImage}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  Clear
                </button>

                <input
                  id="identify-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFile ? (
                <p className="mt-3 text-sm text-slate-500">
                  Selected file:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedFile.name}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="flex flex-col justify-between rounded-3xl bg-slate-50 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Run prediction
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  The system will analyze your image and try to match the result
                  with the fish database.
                </p>

                <div className="mt-5 space-y-3">
                  <StatusRow
                    label="Catalog"
                    value={
                      isLoadingFish ? "Loading..." : `${fishList.length} fish`
                    }
                  />
                  <StatusRow
                    label="Session"
                    value={sessionUser ? "Signed in" : "Guest mode"}
                  />
                  <StatusRow
                    label="History saving"
                    value={
                      sessionUser
                        ? "Automatic after prediction"
                        : "Available after sign in"
                    }
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handlePredict}
                  disabled={isPredicting || isLoadingFish || !selectedFile}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isPredicting ? "Identifying..." : "Identify now"}
                </button>

                {!sessionUser ? (
                  <button
                    type="button"
                    onClick={handleSignInForHistory}
                    className="w-full rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Sign in to save history automatically
                  </button>
                ) : (
                  <Link
                    href="/history"
                    className="block w-full rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    Open prediction history
                  </Link>
                )}
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        {prediction ? (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-blue-600">AI Result</p>
                <h2 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                  {displayName}
                </h2>
              </div>

              <span
                className={
                  resultVariant === "known"
                    ? "rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    : resultVariant === "unknown"
                    ? "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                    : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                }
              >
                {prediction.prediction_type || "Prediction"}
              </span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Confidence</span>
                <span className="font-bold text-blue-700">
                  {confidencePercent.toFixed(0)}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${confidencePercent}%` }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label="Predicted Class"
                value={prediction.predicted_class || "-"}
              />
              <InfoCard
                label="Raw Class"
                value={prediction.raw_predicted_class || "-"}
              />
              <InfoCard
                label="Prediction Type"
                value={prediction.prediction_type || "-"}
              />
              <InfoCard
                label="Catalog Match"
                value={matchedFish?.name || "No exact match"}
              />
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              {matchedFish ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        Matched Catalog Record
                      </p>
                      <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                        {matchedFish.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenFullDetails}
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Open full details
                    </button>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {matchedFish.short_description ||
                      "Basic information is available for this fish species."}
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <InfoCard label="Type" value={matchedFish.type || "-"} />
                    <InfoCard
                      label="Category"
                      value={matchedFish.category || "-"}
                    />
                    <InfoCard
                      label="Habitat"
                      value={matchedFish.habitat || "-"}
                    />
                  </div>

                  {matchedFish.identify_text ? (
                    <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        How to identify
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        {matchedFish.identify_text}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    This prediction does not match a fish detail page yet.
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/fish"
                      className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Browse fish catalog
                    </Link>

                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      Try another image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClearImage}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Start a new prediction
              </button>

              <Link
                href="/history"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Open history
              </Link>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">
        {value}
      </p>
    </div>
  );
}