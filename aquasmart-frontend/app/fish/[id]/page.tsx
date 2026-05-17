"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPublicFishById, type FishListItem, type FishDetailResponse } from "@/lib/api";
import { useI18n } from "@/lib/i18n-context";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AccessGuard } from "@/components/guards/AccessGuard";
import { Lock } from "lucide-react";

export default function FishDetailPage() {
  const params = useParams<{ id: string }>();
  const fishId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { t, locale } = useI18n();
  const [fish, setFish] = useState<FishListItem | null>(null);
  const [detail, setDetail] = useState<FishDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          setError(t.common?.error || "Failed to load fish details");
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
  }, [fishId, t.common]);

  if (loading) return <LoadingSpinner message={t.common?.loading || "Loading..."} />;
  if (error) return <div className="text-center py-12 text-red-600">{error}</div>;
  if (!fish) return <div className="text-center py-12">{t.catalog?.noMatch || "Fish not found"}</div>;

  const name = locale === "th" ? fish.name_th || fish.name : fish.name;
  const description = locale === "th" ? fish.short_description_th || fish.short_description : fish.short_description;

  return (
    <AccessGuard requireAuth={false}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="aspect-video bg-slate-100 relative">
            {fish.cover_image_url ? (
              <img
                src={fish.cover_image_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                No Image
              </div>
            )}
          </div>
          
          <div className="p-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{name}</h1>
            
            {description && (
              <p className="text-slate-600 mb-6">{description}</p>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Basic Info</h3>
                <dl className="space-y-2">
                  {fish.type && (
                    <div className="flex">
                      <dt className="w-32 text-slate-500">Type:</dt>
                      <dd className="text-slate-900">{fish.type}</dd>
                    </div>
                  )}
                  {fish.category && (
                    <div className="flex">
                      <dt className="w-32 text-slate-500">Category:</dt>
                      <dd className="text-slate-900">{fish.category}</dd>
                    </div>
                  )}
                  {fish.habitat && (
                    <div className="flex">
                      <dt className="w-32 text-slate-500">Habitat:</dt>
                      <dd className="text-slate-900">{fish.habitat}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <AccessGuard
              requireAuth
              fallback={
                <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-900 font-medium">Login Required</p>
                    <p className="text-blue-700 text-sm mt-1">
                      Please login to view detailed information about this fish species.
                    </p>
                  </div>
                </div>
              }
            >
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Detailed Information</h3>
                <div className="prose prose-slate max-w-none">
                  {fish.identify_text && (
                    <div className="mb-4">
                      <h4 className="font-medium text-slate-900 mb-2">Identification</h4>
                      <p className="text-slate-600">{fish.identify_text}</p>
                    </div>
                  )}
                  {detail?.farmer_info && (
                    <div className="mb-4">
                      <h4 className="font-medium text-slate-900 mb-2">Farmer Info</h4>
                      <pre className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 overflow-x-auto">
                        {JSON.stringify(detail.farmer_info, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </AccessGuard>
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
