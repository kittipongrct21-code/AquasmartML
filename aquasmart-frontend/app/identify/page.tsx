"use client";
import { ChangeEvent, useEffect, useMemo, useState, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPublicFishList, type FishListItem } from "@/lib/api";
import { supabase } from "@/lib/supabase-client";
import { useI18n, getLocalizedValue } from "@/lib/i18n-context";
import { X, AlertCircle } from "lucide-react";

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

const loadingTextsTH = [
  "กำลังวิเคราะห์จุดเด่นของตัวปลา...",
  "กำลังเปรียบเทียบลักษณะเกล็ดและครีบ...",
  "ระบบ AquaSmart ML กำลังประมวลผลโครงสร้าง...",
  "รอสักครู่ แหล่งน้ำกำลังส่งข้อมูลมา...",
];

const loadingTextsEN = [
  "Analyzing fish features...",
  "Comparing scales and fin structures...",
  "AquaSmart ML is processing the image...",
  "Just a moment, fetching aquatic data...",
];

export default function PredictionPage() {
  const router = useRouter();
  const { locale, t } = useI18n();
  
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [fishList, setFishList] = useState<FishListItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [matchedFish, setMatchedFish] = useState<FishListItem | null>(null);
  const [isLoadingFish, setIsLoadingFish] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [showNotice, setShowNotice] = useState(true);
  const [currentLoadingText, setCurrentLoadingText] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // แกไขจุดที่ 1: แยกการ Revoke ล้างความจำรูปภาพออกต่างหาก ป้องกันการ Re-render ซ้ำซ้อน
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // แก้ไขจุดที่ 2: โหลดข้อมูลปลาและเซสชันผู้ใช้ "รอบแรกครั้งเดียว" ป้องกันปุ่มโดนล็อกค้างตอนเปลี่ยนรูป
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
        console.error("Prediction bootstrap error:", error);
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
    };
  }, []);

  const confidencePercent = useMemo(() => {
    if (!prediction) return 0;
    return Math.max(0, Math.min(100, prediction.confidence_percent || 0));
  }, [prediction]);

  const displayName = useMemo(() => {
    if (!prediction) return "";
    if (prediction.predicted_class === "unknown_fish") {
      return t.prediction.unknownFish;
    }

    if (prediction.predicted_class === "not_a_fish") {
      return t.prediction.notAFish;
    }

    const fish = findFishMatch(fishList, prediction.raw_predicted_class || prediction.predicted_class);
    if (fish) {
      return getLocalizedValue(fish, "name", locale) || fish.name;
    }

    return prediction.raw_predicted_class || prediction.predicted_class;
  }, [prediction, t, fishList, locale]);

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

  function validateAndSetFile(file: File) {
    resetPredictionState();

    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      setErrorMessage(
        locale === "th"
          ? "กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น (.jpeg, .png, .webp)"
          : "Please upload an image file only (.jpeg, .png, .webp)."
      );
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setSelectedFile(null);
      setErrorMessage(
        locale === "th"
          ? "ขนาดรูปภาพใหญ่เกินไป กรุณาเลือกรูปที่มีขนาดไม่เกิน 5MB"
          : "The image file is too large. Please select an image under 5MB."
      );
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
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
      if ("detail" in json && typeof json.detail === "string") {
        throw new Error(json.detail);
      }
      throw new Error("Prediction failed.");
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
    
    let textInterval: any = undefined;
    const startTime = Date.now();

    try {
      setIsPredicting(true);
      setErrorMessage("");
      setPrediction(null);
      setMatchedFish(null);

      const textList = locale === "th" ? loadingTextsTH : loadingTextsEN;
      setCurrentLoadingText(textList[0]);
      
      textInterval = setInterval(() => {
        const randomText = textList[Math.floor(Math.random() * textList.length)];
        setCurrentLoadingText(randomText);
      }, 1400);

      const result = await runPredictionRequest(
        selectedFile,
        sessionUser?.id || undefined
      );

      const elapsedTime = Date.now() - startTime;
      const minDelay = 1800; 
      if (elapsedTime < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsedTime));
      }

      setPrediction(result);
      const rawName = result.raw_predicted_class || result.predicted_class;
      const fish = findFishMatch(fishList, rawName);
      setMatchedFish(fish);

    } catch (error) {
      console.error("Prediction error:", error);
      const fallbackError = locale === "th"
        ? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ทำนายผลได้ (กรุณาตรวจสอบว่าฝั่งหลังบ้าน FastAPI เปิดใช้งานอยู่บนพอร์ต 8000 หรือยังครับ)"
        : "Could not connect to prediction server (Please verify your FastAPI backend is running on port 8000).";
      
      setErrorMessage(
        error instanceof Error && error.message !== "Failed to fetch" ? error.message : fallbackError
      );
    } finally {
      setIsPredicting(false);
      if (textInterval) clearInterval(textInterval);
    }
  }

  function handleClearImage() {
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
    <div className="min-h-screen flex flex-col justify-between bg-slate-50/30">
      
      <main className="flex-grow px-4 py-8">
        <section className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">AI {t.nav.prediction}</p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                  {t.prediction.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {t.prediction.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/fish"
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  {t.prediction.browseCatalog}
                </Link>
                <Link
                  href="/history"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  {t.prediction.viewHistory}
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative flex min-h-80 items-center justify-center overflow-hidden rounded-3xl transition-all ${
                    isDragging 
                      ? "bg-blue-50/60 border-2 border-dashed border-blue-500 ring-4 ring-blue-50" 
                      : "bg-slate-100 border-2 border-transparent"
                  }`}
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Selected fish"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="px-6 py-10 text-center pointer-events-none">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
                        <svg viewBox="0 0 48 32" width="40" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 16 L0 8 C2 12 2 20 0 24 Z" fill="#3b82f6" opacity="0.7"/>
                          <ellipse cx="26" cy="16" rx="20" ry="13" fill="#3b82f6"/>
                          <ellipse cx="24" cy="19" rx="13" ry="7" fill="#93c5fd" opacity="0.5"/>
                          <path d="M22 6 Q26 0 32 5 Q28 8 22 6 Z" fill="#2563eb" opacity="0.85"/>
                          <circle cx="38" cy="14" r="5" fill="white"/>
                          <circle cx="39" cy="14" r="3" fill="#1e3a8a"/>
                          <circle cx="40" cy="13" r="1.2" fill="white"/>
                          <path d="M26 8 Q29 5 32 8" stroke="#1d4ed8" strokeWidth="0.8" fill="none" opacity="0.4"/>
                          <path d="M20 8 Q23 5 26 8" stroke="#1d4ed8" strokeWidth="0.8" fill="none" opacity="0.35"/>
                        </svg>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        {isDragging 
                          ? (locale === "th" ? "ปล่อยเมาส์เพื่อวางรูปภาพได้เลย" : "Drop to upload image") 
                          : t.prediction.selectImage}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {t.prediction.supportedFormats}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <label
                    htmlFor="prediction-file"
                    className="inline-flex cursor-pointer rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                  >
                    {t.prediction.chooseImage}
                  </label>

                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    {t.common.clear}
                  </button>

                  <input
                    id="prediction-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {selectedFile ? (
                  <p className="mt-3 text-sm text-slate-500">
                    {t.prediction.selectedFile}{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedFile.name}
                    </span>
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col justify-between rounded-3xl bg-slate-50 p-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {t.prediction.runPredictionTitle}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {t.prediction.runPredictionDesc}
                  </p>

                  <div className="mt-5 space-y-3">
                    {/* 🛠️ แก้ไขจุดหลัก: เปลี่ยนจากดึงเลขตารางรวม มาเป็น Hardcode ตัวเลข 10 ชนิด และเปลี่ยนชื่อป้ายกำกับเพื่อความชัดเจน */}
                    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                      <span className="text-sm font-semibold text-slate-500">
                        {locale === "th" ? "สายพันธุ์ที่รองรับ" : "Supported Species"}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        10 {locale === "th" ? "ชนิด" : "Species"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                      <span className="text-sm font-semibold text-slate-500">{t.prediction.sessionStatus}</span>
                      <span className="text-sm font-bold text-slate-900">{sessionUser ? t.prediction.signedIn : t.prediction.guestMode}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                      <span className="text-sm font-semibold text-slate-500">{t.prediction.historySaving}</span>
                      <span className="text-sm font-bold text-slate-900">{sessionUser ? t.prediction.autoSave : t.prediction.availableSignIn}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handlePredict}
                    disabled={isPredicting || isLoadingFish || !selectedFile}
                    className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isPredicting ? t.prediction.predicting : t.prediction.predictNow}
                  </button>

                  {!sessionUser ? (
                    <button
                      type="button"
                      onClick={handleSignInForHistory}
                      className="w-full rounded-2xl bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      {t.prediction.signInToSave}
                    </button>
                  ) : (
                    <Link
                      href="/history"
                      className="block w-full rounded-2xl bg-white px-4 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      {t.prediction.openHistory}
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
                  <p className="text-sm font-semibold text-blue-600">{t.prediction.aiResult}</p>
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
                  {prediction.prediction_type || "-"}
                </span>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{t.prediction.confidence}</span>
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
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t.prediction.predictedClass}</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">{prediction.predicted_class || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t.prediction.rawClass}</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">{prediction.raw_predicted_class || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t.prediction.predictionType}</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">{prediction.prediction_type || "-"}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{t.prediction.catalogMatch}</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-slate-900">{matchedFish ? (getLocalizedValue(matchedFish, "name", locale) || matchedFish.name) : "-"}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 rounded-3xl bg-slate-50 p-5">
                {matchedFish ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-600">
                          {t.prediction.matchedRecord}
                        </p>
                        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
                          {getLocalizedValue(matchedFish, "name", locale) || matchedFish.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenFullDetails}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {t.prediction.openDetails}
                      </button>
                    </div>

                    <p className="text-sm leading-7 text-slate-600">
                      {getLocalizedValue(matchedFish, "short_description", locale) ||
                        "Basic information is available for this fish species."}
                    </p>

                    {getLocalizedValue(matchedFish, "identify_text", locale) ? (
                      <div className="mt-4 rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-slate-200">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          {t.prediction.identificationGuide}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                          {getLocalizedValue(matchedFish, "identify_text", locale)}
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-800">
                      {t.prediction.noMatchDesc}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/fish"
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {t.prediction.browseCatalog}
                      </Link>

                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        {t.prediction.tryAnother}
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
                  {t.prediction.startNew}
                </button>

                <Link
                  href="/history"
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                >
                  {t.prediction.openHistory}
                </Link>
              </div>
            </section>
          ) : null}
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 bg-white py-4 text-center text-xs font-bold tracking-wide text-slate-400">
        {locale === "th" 
          ? "ระบบของเรากำลังพัฒนา อาจมีข้อผิดพลาดได้" 
          : "Our system is currently under development and may contain errors."}
      </footer>

      {showNotice ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            
            <button 
              type="button"
              onClick={() => setShowNotice(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-extrabold text-slate-900">
                {locale === "th" ? "ประกาศระบบกำลังพัฒนา" : "Development Notice"}
              </h3>
            </div>

            <p className="text-sm font-medium leading-7 text-slate-600">
              {locale === "th" 
                ? "เนื่องจากตอนนี้ระบบของเราอยู่ในช่วงกำลังพัฒนา จึงทำให้ปลาที่สามารถทำนายได้มีเพียง 10 ชนิด นอกเหนือจากนั้นระบบจะตอบว่า ไม่ใช่ปลา หรือ ไม่รู้จักปลา ชนิดนี้ คุณสามารถ เข้าไปดูปลาสายพันธุ์อืนได้ที่ช่องค้นหาปลา ขออภัยในความไม่สดวก" 
                : "Since our system is currently under development, the model can only classify 10 specific fish species. Any other species will be identified as 'Not a fish' or 'Unknown fish'. You can check and explore other species in our fish catalog search section. We apologize for any inconvenience caused."
              }
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowNotice(false)}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-sm"
              >
                {locale === "th" ? "รับทราบและปิดหน้าต่าง" : "Dismiss Notice"}
              </button>
            </div>

          </div>
        </div>
      ) : null}

      {isPredicting && (
        <div className="fixed inset-0 bg-gradient-to-b from-blue-900/60 to-cyan-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="relative max-w-sm w-full text-center flex flex-col items-center justify-center space-y-5 overflow-hidden"
            style={{ minHeight: 340 }}
          >
            <style>{`
              @keyframes fish-swim {
                0%   { transform: translateX(-6px) translateY(2px) rotate(-4deg); }
                25%  { transform: translateX(0px)  translateY(-5px) rotate(0deg); }
                50%  { transform: translateX(6px)  translateY(2px) rotate(4deg); }
                75%  { transform: translateX(0px)  translateY(-5px) rotate(0deg); }
                100% { transform: translateX(-6px) translateY(2px) rotate(-4deg); }
              }
              @keyframes tail-wag {
                0%   { transform: rotate(-28deg) scaleX(0.9); }
                50%  { transform: rotate(28deg)  scaleX(1.05); }
                100% { transform: rotate(-28deg) scaleX(0.9); }
              }
              @keyframes fin-flap {
                0%,100% { transform: scaleY(1) rotate(-6deg); }
                50%     { transform: scaleY(1.35) rotate(6deg); }
              }
              @keyframes pec-flap {
                0%,100% { transform: rotate(-15deg) scaleX(1); }
                50%     { transform: rotate(20deg)  scaleX(1.2); }
              }
              @keyframes blink {
                0%,90%,100% { transform: scaleY(1); }
                95%         { transform: scaleY(0.08); }
              }
              @keyframes blush-pulse {
                0%,100% { opacity: 0.55; }
                50%     { opacity: 0.9; }
              }
              @keyframes bubble-up {
                0%   { transform: translateY(0px) translateX(0px) scale(0.5); opacity: 0; }
                15%  { opacity: 0.85; }
                70%  { opacity: 0.5; }
                100% { transform: translateY(-110px) translateX(var(--bx,8px)) scale(1.15); opacity: 0; }
              }
              @keyframes card-bounce {
                0%,100% { transform: translateY(0px); }
                50%     { transform: translateY(-6px); }
              }
              @keyframes text-wave {
                0%,100% { opacity: 1; }
                50%     { opacity: 0.45; }
              }
              @keyframes sparkle {
                0%,100% { transform: scale(0) rotate(0deg);   opacity: 0; }
                40%     { transform: scale(1.2) rotate(180deg); opacity: 1; }
                80%     { transform: scale(0.7) rotate(360deg); opacity: 0.6; }
              }
              .fish-body   { animation: fish-swim 1.1s ease-in-out infinite; }
              .fish-tail   { animation: tail-wag  0.18s ease-in-out infinite; transform-origin: 2px 14px; }
              .fish-fin    { animation: fin-flap  0.35s ease-in-out infinite; transform-origin: 22px 8px; }
              .fish-pec    { animation: pec-flap  0.3s ease-in-out infinite; transform-origin: 28px 22px; }
              .fish-eye    { animation: blink     2.8s ease-in-out infinite; transform-origin: 20px 19px; }
              .fish-blush  { animation: blush-pulse 1.4s ease-in-out infinite; }
              .card-anim   { animation: card-bounce 2s ease-in-out infinite; }
              .bubble      { animation: bubble-up 2s ease-in infinite; }
              .bubble-2    { animation: bubble-up 2.6s ease-in infinite 0.7s; --bx: -6px; }
              .bubble-3    { animation: bubble-up 1.8s ease-in infinite 1.3s; --bx: 12px; }
              .bubble-4    { animation: bubble-up 2.3s ease-in infinite 0.3s; --bx: -12px; }
              .sparkle-1   { animation: sparkle 2.0s ease-in-out infinite 0.2s; }
              .sparkle-2   { animation: sparkle 2.4s ease-in-out infinite 0.9s; }
              .sparkle-3   { animation: sparkle 1.8s ease-in-out infinite 1.5s; }
              .loading-txt { animation: text-wave 1.4s ease-in-out infinite; }
            `}</style>

            <div className="card-anim bg-white/95 rounded-3xl shadow-2xl px-8 pt-6 pb-7 w-full flex flex-col items-center gap-4 border border-blue-100">

              <div
                className="relative flex items-center justify-center rounded-2xl overflow-hidden"
                style={{
                  width: 200,
                  height: 130,
                  background: "linear-gradient(180deg,#bae6fd 0%,#7dd3fc 55%,#38bdf8 100%)",
                  boxShadow: "inset 0 4px 20px rgba(56,189,248,0.35), 0 4px 16px rgba(14,165,233,0.2)",
                }}
              >
                <div
                  style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.25) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                <svg style={{ position:"absolute", bottom:0, left:8 }} width="18" height="36" viewBox="0 0 18 36">
                  <path d="M9 36 Q3 28 9 20 Q15 12 9 4" stroke="#4ade80" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <circle cx="9" cy="4" r="4" fill="#22c55e"/>
                </svg>
                <svg style={{ position:"absolute", bottom:0, right:10 }} width="14" height="28" viewBox="0 0 14 28">
                  <path d="M7 28 Q2 22 7 16 Q12 10 7 4" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                  <circle cx="7" cy="4" r="3" fill="#10b981"/>
                </svg>
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0, height:14,
                  background:"linear-gradient(90deg,#fde68a,#fbbf24,#fde68a,#fed7aa)",
                  borderRadius:"0 0 12px 12px"
                }}/>

                <div className="bubble"  style={{ position:"absolute", bottom:14, left:"38%",  width:7,  height:7,  borderRadius:"50%", background:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.9)" }}/>
                <div className="bubble-2" style={{ position:"absolute", bottom:14, left:"58%",  width:5,  height:5,  borderRadius:"50%", background:"rgba(255,255,255,0.6)", border:"1px solid rgba(255,255,255,0.8)" }}/>
                <div className="bubble-3" style={{ position:"absolute", bottom:14, left:"28%",  width:4,  height:4,  borderRadius:"50%", background:"rgba(255,255,255,0.5)", border:"1px solid rgba(255,255,255,0.7)" }}/>
                <div className="bubble-4" style={{ position:"absolute", bottom:14, left:"70%",  width:6,  height:6,  borderRadius:"50%", background:"rgba(255,255,255,0.65)", border:"1px solid rgba(255,255,255,0.85)" }}/>

                <div className="sparkle-1" style={{ position:"absolute", top:16, left:20 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="#fbbf24"/></svg>
                </div>
                <div className="sparkle-2" style={{ position:"absolute", top:12, right:18 }}>
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="#a78bfa"/></svg>
                </div>
                <div className="sparkle-3" style={{ position:"absolute", top:30, left:60 }}>
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M7 0 L8.2 5.8 L14 7 L8.2 8.2 L7 14 L5.8 8.2 L0 7 L5.8 5.8 Z" fill="#fbbf24"/></svg>
                </div>

                <div className="fish-body" style={{ position:"relative", zIndex:2 }}>
                  <svg viewBox="0 0 80 44" width="108" height="60">
                    <defs>
                      <linearGradient id="bodyG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor="#fb923c"/>
                        <stop offset="50%"  stopColor="#f97316"/>
                        <stop offset="100%" stopColor="#ea580c"/>
                      </linearGradient>
                      <linearGradient id="bellyG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#fed7aa"/>
                        <stop offset="100%" stopColor="#fdba74"/>
                      </linearGradient>
                      <linearGradient id="tailG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor="#fb923c"/>
                        <stop offset="100%" stopColor="#c2410c"/>
                      </linearGradient>
                      <linearGradient id="finG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#fdba74"/>
                        <stop offset="100%" stopColor="#f97316"/>
                      </linearGradient>
                      <radialGradient id="eyeG" cx="40%" cy="35%">
                        <stop offset="0%"   stopColor="#ffffff"/>
                        <stop offset="100%" stopColor="#e2e8f0"/>
                      </radialGradient>
                      <radialGradient id="blushG" cx="50%" cy="50%">
                        <stop offset="0%"   stopColor="#fca5a5"/>
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0"/>
                      </radialGradient>
                    </defs>

                    <g className="fish-tail">
                      <path d="M8 22 L-4 10 C-1 16,-1 28, -4 34 Z" fill="url(#tailG)" opacity="0.9"/>
                    </g>

                    <ellipse cx="38" cy="22" rx="30" ry="18" fill="url(#bodyG)"/>
                    <ellipse cx="36" cy="26" rx="20" ry="10" fill="url(#bellyG)" opacity="0.6"/>

                    <path d="M38 12 Q42 8 46 12" stroke="#ea580c" strokeWidth="1" fill="none" opacity="0.5"/>
                    <path d="M30 11 Q34 7 38 11" stroke="#ea580c" strokeWidth="1" fill="none" opacity="0.4"/>
                    <path d="M46 14 Q50 10 54 14" stroke="#ea580c" strokeWidth="1" fill="none" opacity="0.4"/>

                    <g className="fish-fin">
                      <path d="M34 8 Q38 -1 46 6 Q42 10 34 8 Z" fill="url(#finG)" opacity="0.9"/>
                    </g>

                    <g className="fish-pec">
                      <path d="M32 24 Q26 30 24 38 Q30 34 36 27 Z" fill="url(#finG)" opacity="0.8"/>
                    </g>

                    <path d="M54 16 Q62 12 64 20 Q58 18 54 16Z" fill="url(#finG)" opacity="0.7"/>

                    <g className="fish-eye">
                      <circle cx="56" cy="19" r="7" fill="url(#eyeG)" stroke="white" strokeWidth="1"/>
                      <circle cx="57" cy="19" r="4.5" fill="#1e293b"/>
                      <circle cx="58" cy="17" r="1.8" fill="white"/>
                      <circle cx="55" cy="20.5" r="0.9" fill="white" opacity="0.6"/>
                    </g>

                    <ellipse className="fish-blush" cx="50" cy="25" rx="5" ry="3.5" fill="url(#blushG)" opacity="0.55"/>

                    <path d="M65 22 Q68 25 65 26" stroke="#c2410c" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

                    <path d="M42 6 Q44 22 42 38" stroke="rgba(255,255,255,0.35)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div className="space-y-1.5 w-full">
                <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">
                  {locale === "th" ? "กำลังตรวจสอบสายพันธุ์" : "Processing Prediction"}
                </h3>
                <p className="loading-txt text-sm font-medium text-blue-500 px-2 min-h-[20px]">
                  {currentLoadingText}
                </p>
              </div>

              <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  style={{
                    height:"100%",
                    background:"linear-gradient(90deg,#38bdf8,#818cf8,#fb923c)",
                    backgroundSize:"200% 100%",
                    borderRadius:"9999px",
                    animation:"shimmer 1.2s linear infinite",
                  }}
                />
                <style>{`@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}width:70%}`}</style>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
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