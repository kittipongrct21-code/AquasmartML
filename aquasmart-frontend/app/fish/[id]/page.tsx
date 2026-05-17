"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPublicFishById, type FishListItem, type FishDetailResponse } from "@/lib/api";
import { useI18n, getLocalizedValue } from "@/lib/i18n-context";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AccessGuard } from "@/components/guards/AccessGuard";
import { Lock } from "lucide-react";

type DetailTab = "general" | "farmer" | "ornamental";

export default function FishDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fishId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { t: dict, locale } = useI18n();
  
  const [fish, setFish] = useState<FishListItem | null>(null);
  const [detail, setDetail] = useState<FishDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DetailTab>("general");

  useEffect(() => {
    let active = true;

    async function loadFishDetail() {
      if (!fishId) {
        if (active) {
          setError("Fish ID is missing");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await getPublicFishById(fishId);
        if (active) {
          setDetail(data ?? null);
          setFish(data?.fish ?? null);
        }
      } catch (error) {
        console.error("Failed to load fish detail:", error);
        if (active) {
          setError(dict.common?.error || "Failed to load fish details");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFishDetail();

    return () => {
      active = false;
    };
  }, [fishId, dict.common]);

  // แมปปิ้งฟิลด์ข้อมูลเกษตรกร (Farmer Fields Mapping)
  const farmerItems = useMemo(() => {
    if (!detail?.farmer_info) return [];
    const info = detail.farmer_info;
    
    const fields = [
      { labelEn: "How to Raise", labelTh: "วิธีการเลี้ยง", key: "how_to_raise" },
      { labelEn: "Pond Type", labelTh: "ประเภทบ่อเลี้ยง", key: "pond_type" },
      { labelEn: "Pond Size", labelTh: "ขนาดบ่อเลี้ยง", key: "pond_size" },
      { labelEn: "Population per Pond", labelTh: "ความหนาแน่นต่อบ่อ", key: "population_per_pond" },
      { labelEn: "Water Temperature", labelTh: "อุณหภูมิน้ำ", key: "water_temp" },
      { labelEn: "pH Level", labelTh: "ค่า pH ของน้ำ", key: "ph" },
      { labelEn: "Water Preparation", labelTh: "การเตรียมน้ำ", key: "water_prep" },
      { labelEn: "Recommended Food", labelTh: "อาหารที่แนะนำ", key: "recommended_food" },
      { labelEn: "Not Recommended Food", labelTh: "อาหารที่ไม่แนะนำ", key: "not_recommended_food" },
      { labelEn: "Feeding Frequency", labelTh: "ความถี่การให้อาหาร", key: "feeding_frequency" },
      { labelEn: "Feeding Amount", labelTh: "ปริมาณการให้อาหาร", key: "feeding_amount" },
      { labelEn: "Compatible Species", labelTh: "สายพันธุ์ที่เลี้ยงร่วมกันได้", key: "compatible_species" },
      { labelEn: "Incompatible Species", labelTh: "สายพันธุ์ที่ไม่ควรเลี้ยงร่วมกัน", key: "incompatible_species" },
      { labelEn: "Growth Rate", labelTh: "อัตราการเจริญเติบโต", key: "growth_rate" },
      { labelEn: "Common Diseases", labelTh: "โรคที่พบบ่อย", key: "common_diseases" },
      { labelEn: "Disease Prevention", labelTh: "การป้องกันโรค", key: "disease_prevention" },
      { labelEn: "Source Type", labelTh: "ประเภทแหล่งที่มาพันธุ์ปลา", key: "source_type" },
      { labelEn: "Source Size", labelTh: "ขนาดพันธุ์ปลาที่นำมาเลี้ยง", key: "source_size" },
      { labelEn: "System Type", labelTh: "ประเภทระบบการเลี้ยง", key: "system_type" },
      { labelEn: "Survival Rate", labelTh: "อัตราการรอดชีวิต", key: "survival_rate" },
      { labelEn: "Notes", labelTh: "หมายเหตุเพิ่มเติม", key: "notes" },
    ];

    return fields
      .map((f) => ({
        label: locale === "th" ? f.labelTh : f.labelEn,
        value: getLocalizedValue(info, f.key as any, locale),
      }))
      .filter((item) => item.value.trim() !== "");
  }, [detail?.farmer_info, locale]);

  // แมปปิ้งฟิลด์ข้อมูลปลาสวยงาม (Ornamental Fields Mapping)
  const ornamentalItems = useMemo(() => {
    if (!detail?.ornamental_info) return [];
    const info = detail.ornamental_info;

    const fields = [
      { labelEn: "Tank Environment", labelTh: "สภาพแวดล้อมตู้เลี้ยง", key: "environment" },
      { labelEn: "Population Setup", labelTh: "จำนวนประชากรในตู้", key: "population" },
      { labelEn: "Water Temperature", labelTh: "อุณหภูมิน้ำ", key: "water_temp" },
      { labelEn: "pH Level", labelTh: "ค่า pH ของน้ำ", key: "ph" },
      { labelEn: "Tank Preparation", labelTh: "การเตรียมตู้และน้ำ", key: "preparation" },
      { labelEn: "Recommended Food", labelTh: "อาหารที่แนะนำ", key: "recommended_food" },
      { labelEn: "Not Recommended Food", labelTh: "อาหารที่ไม่แนะนำ", key: "not_recommended_food" },
      { labelEn: "Feeding Frequency", labelTh: "ความถี่การให้อาหาร", key: "feeding_frequency" },
      { labelEn: "Feeding Amount", labelTh: "ปริมาณการให้อาหาร", key: "feeding_amount" },
      { labelEn: "Source Type", labelTh: "ประเภทแหล่งที่มา", key: "source_type" },
      { labelEn: "Source Size", labelTh: "ขนาดปลาเริ่มต้น", key: "source_size" },
      { labelEn: "Compatible Species", labelTh: "สายพันธุ์ที่เลี้ยงร่วมกันได้", key: "compatible_species" },
      { labelEn: "Incompatible Species", labelTh: "สายพันธุ์ที่ไม่ควรเลี้ยงร่วมกัน", key: "incompatible_species" },
      { labelEn: "Growth Rate", labelTh: "อัตราการเจริญเติบโต", key: "growth_rate" },
      { labelEn: "Common Diseases", labelTh: "โรคที่พบบ่อย", key: "common_diseases" },
      { labelEn: "Disease Prevention", labelTh: "การป้องกันโรค", key: "disease_prevention" },
      { labelEn: "System Type", labelTh: "ประเภทระบบตู้และกรอง", key: "system_type" },
      { labelEn: "Survival Rate", labelTh: "อัตราการรอดชีวิต", key: "survival_rate" },
      { labelEn: "Notes", labelTh: "หมายเหตุเพิ่มเติม", key: "notes" },
    ];

    return fields
      .map((f) => ({
        label: locale === "th" ? f.labelTh : f.labelEn,
        value: getLocalizedValue(info, f.key as any, locale),
      }))
      .filter((item) => item.value.trim() !== "");
  }, [detail?.ornamental_info, locale]);

  if (loading) return <LoadingSpinner message={dict.common?.loading || "Loading..."} />;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!fish) return <div className="text-center py-12">{dict.catalog?.noMatch || "Fish not found"}</div>;

  // ดึงค่าสองภาษาของข้อมูลทั่วไป (General Info)
  const fishName = getLocalizedValue(fish, "name", locale);
  const fishDesc = getLocalizedValue(fish, "short_description", locale);
  const fishType = getLocalizedValue(fish, "type", locale);
  const fishCategory = getLocalizedValue(fish, "category", locale);
  const fishHabitat = getLocalizedValue(fish, "habitat", locale);
  const fishOrigin = getLocalizedValue(fish, "origin", locale);
  const fishIdentify = getLocalizedValue(fish, "identify_text", locale);

  return (
    <AccessGuard requireAuth={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* ส่วนปุ่มย้อนกลับ */}
        <div className="mb-4">
          <button 
            onClick={() => router.push("/fish")}
            className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            {locale === "th" ? "← กลับไปหน้ารายการ" : "← Back to Catalog"}
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          {/* ส่วนรูปภาพหน้าปก */}
          <div className="aspect-video bg-slate-100 relative max-h-[400px] w-full">
            {fish.cover_image_url ? (
              <img src={fish.cover_image_url} alt={fishName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
            )}
          </div>
          
          <div className="p-6">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{fishName}</h1>
            
            {fishDesc && (
              <p className="text-slate-600 text-sm leading-7 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">{fishDesc}</p>
            )}

            {/* ส่วนควบคุมแถบแท็บข้อมูลหน้าบ้าน */}
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
              <button
                onClick={() => setActiveTab("general")}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "general" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {locale === "th" ? "ข้อมูลทั่วไป" : "General Info"}
              </button>
              <button
                onClick={() => setActiveTab("farmer")}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "farmer" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {locale === "th" ? "ข้อมูลสำหรับเกษตรกร" : "Farmer Info"}
              </button>
              <button
                onClick={() => setActiveTab("ornamental")}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "ornamental" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {locale === "th" ? "ข้อมูลปลาสวยงาม" : "Ornamental Info"}
              </button>
            </div>

            {/* เผยแพร่ข้อมูลแต่ละแท็บ */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{locale === "th" ? "ข้อมูลพื้นฐานพันธุ์ปลา" : "Basic Information"}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fishType && <InfoBox label={locale === "th" ? "ประเภท" : "Type"} value={fishType} />}
                    {fishCategory && <InfoBox label={locale === "th" ? "หมวดหมู่" : "Category"} value={fishCategory} />}
                    {fishOrigin && <InfoBox label={locale === "th" ? "แหล่งกำเนิด" : "Origin"} value={fishOrigin} />}
                    {fish.average_lifespan && <InfoBox label={locale === "th" ? "อายุขัยเฉลี่ย" : "Average Lifespan"} value={fish.average_lifespan} />}
                    {fish.adult_size && <InfoBox label={locale === "th" ? "ขนาดเมื่อโตเต็มที่" : "Adult Size"} value={fish.adult_size} />}
                  </div>
                </div>

                {fishHabitat && (
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{locale === "th" ? "แหล่งที่อยู่อาศัยตามธรรมชาติ" : "Natural Habitat"}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{fishHabitat}</p>
                  </div>
                )}
              </div>
            )}

            {/* ส่วนข้อมูลเชิงลึกที่ต้องล็อคสิทธิ์ล็อกอิน (Farmer และ Ornamental) */}
            {activeTab !== "general" && (
              <AccessGuard
                requireAuth
                fallback={
                  <div className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse">
                    <Lock className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-900 font-bold text-lg">{locale === "th" ? "จำเป็นต้องเข้าสู่ระบบ" : "Login Required"}</p>
                      <p className="text-blue-700 text-sm mt-1">
                        {locale === "th" ? "กรุณาเข้าสู่ระบบเพื่อเปิดดูข้อมูลเทคนิคและคำแนะนำเชิงลึกสำหรับปลาสายพันธุ์นี้" : "Please login to view detailed expert information about this fish species."}
                      </p>
                    </div>
                  </div>
                }
              >
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeTab === "farmer" ? (locale === "th" ? "คู่มือการเพาะเลี้ยงเชิงพาณิชย์" : "Commercial Farming Details") : (locale === "th" ? "คู่มือการเลี้ยงปลาสวยงามในตู้" : "Aquarium Care Details")}
                  </h3>
                  
                  {activeTab === "farmer" && (
                    farmerItems.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-4">{locale === "th" ? "ไม่มีข้อมูลสำหรับเกษตรกรระบุไว้" : "No farmer details specified yet."}</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {farmerItems.map((item, idx) => <InfoBox key={idx} label={item.label} value={item.value} />)}
                      </div>
                    )
                  )}

                  {activeTab === "ornamental" && (
                    ornamentalItems.length === 0 ? (
                      <p className="text-sm text-slate-500 italic py-4">{locale === "th" ? "ไม่มีข้อมูลปลาสวยงามระบุไว้" : "No ornamental details specified yet."}</p>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {ornamentalItems.map((item, idx) => <InfoBox key={idx} label={item.label} value={item.value} />)}
                      </div>
                    )
                  )}
                </div>
              </AccessGuard>
            )}

            {/* ส่วนวิธีสังเกตอัตลักษณ์ (ย้ายลงมาล่างสุดให้อ่านง่าย) */}
            {fishIdentify && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100">
                  <h4 className="font-bold text-blue-900 mb-2">{locale === "th" ? "วิธีสังเกตและจำแนกสายพันธุ์ (Identification)" : "How to Identify"}</h4>
                  <p className="text-slate-700 text-sm leading-7">{fishIdentify}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AccessGuard>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100/60 flex flex-col justify-center">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1.5 text-sm font-semibold text-slate-800 leading-6 break-words">{value}</p>
    </div>
  );
}