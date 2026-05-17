import { supabase } from "@/lib/supabase-client";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

/* =========================================================
   Types
========================================================= */

export type FishListItem = {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  type?: string | null;
  category?: string | null;
  habitat?: string | null;
  identify_text?: string | null;
  average_lifespan?: string | null;
  average_lifespan_th?: string | null; // ✅ เพิ่มรองรับภาษาไทย
  adult_size?: string | null;
  adult_size_th?: string | null; // ✅ เพิ่มรองรับภาษาไทย
  cover_image_url?: string | null;
  is_active?: boolean;
  origin?: string | null;
  name_th?: string | null;
  short_description_th?: string | null;
  type_th?: string | null;
  category_th?: string | null;
  habitat_th?: string | null;
  identify_text_th?: string | null;
  origin_th?: string | null;
};

export type FishImageItem = {
  id: number;
  fish_id: number;
  image_url: string;
  alt_text?: string | null;
  is_cover?: boolean;
  created_at?: string | null;
};

export type FishDetailResponse = {
  fish: FishListItem;
  farmer_info?: Record<string, unknown> | null;
  ornamental_info?: Record<string, unknown> | null;
  images?: FishImageItem[];
};

export type FishGeneralPayload = {
  name: string;
  slug: string;
  short_description?: string | null;
  type?: string | null;
  category?: string | null;
  habitat?: string | null;
  identify_text?: string | null;
  average_lifespan?: string | null;
  average_lifespan_th?: string | null; // ✅ เพิ่มรองรับภาษาไทย
  adult_size?: string | null;
  adult_size_th?: string | null; // ✅ เพิ่มรองรับภาษาไทย
  cover_image_url?: string | null;
  is_active?: boolean;
  origin?: string | null;
  name_th?: string | null;
  short_description_th?: string | null;
  type_th?: string | null;
  category_th?: string | null;
  habitat_th?: string | null;
  identify_text_th?: string | null;
  origin_th?: string | null;
};

export type FishFarmerPayload = {
  how_to_raise?: string | null;
  pond_type?: string | null;
  pond_size?: string | null;
  population_per_pond?: string | null;
  water_temp?: string | null;
  ph?: string | null;
  water_prep?: string | null;
  recommended_food?: string | null;
  not_recommended_food?: string | null;
  feeding_frequency?: string | null;
  feeding_amount?: string | null;
  compatible_species?: string | null;
  growth_rate?: string | null;
  common_diseases?: string | null;
  disease_prevention?: string | null;
  source_type?: string | null;
  source_size?: string | null;
  system_type?: string | null;
  incompatible_species?: string | null;
  survival_rate?: string | null;
  notes?: string | null;
  how_to_raise_th?: string | null;
  pond_type_th?: string | null;
  pond_size_th?: string | null;
  population_per_pond_th?: string | null;
  water_temp_th?: string | null;
  ph_th?: string | null;
  water_prep_th?: string | null;
  recommended_food_th?: string | null;
  not_recommended_food_th?: string | null;
  feeding_frequency_th?: string | null;
  feeding_amount_th?: string | null;
  compatible_species_th?: string | null;
  growth_rate_th?: string | null;
  common_diseases_th?: string | null;
  disease_prevention_th?: string | null;
  source_type_th?: string | null;
  source_size_th?: string | null;
  system_type_th?: string | null;
  incompatible_species_th?: string | null;
  survival_rate_th?: string | null;
  notes_th?: string | null;
};

export type FishOrnamentalPayload = {
  environment?: string | null;
  population?: string | null;
  water_temp?: string | null;
  ph?: string | null;
  preparation?: string | null;
  recommended_food?: string | null;
  feeding_frequency?: string | null;
  feeding_amount?: string | null;
  source_type?: string | null;
  source_size?: string | null;
  compatible_species?: string | null;
  growth_rate?: string | null;
  common_diseases?: string | null;
  disease_prevention?: string | null;
  system_type?: string | null;
  incompatible_species?: string | null;
  survival_rate?: string | null;
  not_recommended_food?: string | null;
  notes?: string | null;
  environment_th?: string | null;
  population_th?: string | null;
  water_temp_th?: string | null;
  ph_th?: string | null;
  preparation_th?: string | null;
  recommended_food_th?: string | null;
  feeding_frequency_th?: string | null;
  feeding_amount_th?: string | null;
  source_type_th?: string | null;
  source_size_th?: string | null;
  compatible_species_th?: string | null;
  growth_rate_th?: string | null;
  common_diseases_th?: string | null;
  disease_prevention_th?: string | null;
  system_type_th?: string | null;
  incompatible_species_th?: string | null;
  survival_rate_th?: string | null;
  not_recommended_food_th?: string | null;
  notes_th?: string | null;
};

export type FishImagePayload = {
  image_url: string;
  alt_text?: string | null;
  is_cover?: boolean;
};
export type FishPayload = {
  general: FishGeneralPayload;
  farmer?: FishFarmerPayload | null;
  ornamental?: FishOrnamentalPayload | null;
  images?: FishImagePayload[];
};

export type PredictionResponse = {
  predicted_class: string;
  raw_predicted_class?: string;
  confidence_percent: number;
  prediction_type?: string;
  fish_name?: string;
  image_url?: string;
  result_json?: Record<string, unknown>;
};

export type HistoryItem = {
  id: number;
  user_id: string;
  fish_id?: number | null;
  fish_name?: string | null;
  predicted_class: string;
  raw_predicted_class?: string | null;
  confidence_percent?: number | null;
  prediction_type?: string | null;
  uploaded_image_url?: string | null;
  image_url?: string | null;
  result_json?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type HistoryCreatePayload = {
  user_id: string;
  fish_id?: number | null;
  fish_name?: string | null;
  predicted_class: string;
  raw_predicted_class?: string | null;
  confidence_percent?: number | null;
  prediction_type?: string | null;
  result_json: Record<string, unknown>;
  uploaded_image_url?: string | null;
  image_url?: string | null;
};

export type Profile = {
  id: string;
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: "user" | "admin" | string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ProfileUpdatePayload = {
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  role?: string | null;
};

export type AuthPayload = {
  email: string;
  password: string;
};

export type AuthResponseData = {
  user_id?: string | null;
  email?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
};

export type UploadImageResponse = {
  message: string;
  bucket: string;
  path: string;
  public_url: string;
};

export type FavoriteItem = {
  id: number;
  user_id: string;
  fish_id: number;
  created_at?: string | null;
  fish_species?: FishListItem | null;
};

export type FavoritePayload = {
  user_id: string;
  fish_id: number;
};

/* =========================================================
   Internal helpers
========================================================= */

async function parseError(response: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const text = await response.text().catch(() => "");
    try {
      const data = JSON.parse(text);
      if (data && data.detail) {
        if (typeof data.detail === "string") {
          message = data.detail;
        } else {
          message = JSON.stringify(data.detail);
        }
      } else if (data && data.message) {
        message = data.message;
      } else if (text) {
        message = text;
      }
    } catch {
      if (text) message = text;
    }
  } catch (e) {
    console.error("Failed to parse error response:", e);
  }
  throw new Error(message);
}

async function requestJson<T>(
  url: string,
  init?: RequestInit,
  fallbackMessage = "Request failed"
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(init?.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  
  if (!headers.has("Content-Type") && init?.body) {
    if (!(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    await parseError(response, fallbackMessage);
  }
  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | boolean | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/* =========================================================
   Public fish APIs
========================================================= */

export async function getPublicFishList(q?: string): Promise<FishListItem[]> {
  const query = buildQuery({ q });
  const data = await requestJson<{ data: FishListItem[] }>(
    `${API_BASE_URL}/fish${query}`,
    undefined,
    "Failed to fetch fish list"
  );

  return data.data || [];
}

export async function getPublicFish(): Promise<FishListItem[]> {
  return getPublicFishList();
}

export async function getPublicFishById(
  fishId: string | number
): Promise<FishDetailResponse> {
  return requestJson<FishDetailResponse>(
    `${API_BASE_URL}/fish/${fishId}`,
    undefined,
    "Failed to fetch fish detail"
  );
}

/* =========================================================
   Prediction APIs
========================================================= */

export async function predictFish(
  file: File,
  userId?: string
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (userId) {
    formData.append("user_id", userId);
  }

  return requestJson<PredictionResponse>(
    `${API_BASE_URL}/predict`,
    {
      method: "POST",
      body: formData,
    },
    "Prediction failed"
  );
}

/* =========================================================
   Admin fish APIs
========================================================= */

export async function getAdminFish(params?: {
  q?: string;
  status?: string;
  category?: string;
  fish_type?: string;
}): Promise<FishListItem[]> {
  const query = buildQuery({
    q: params?.q,
    status: params?.status,
    category: params?.category,
    fish_type: params?.fish_type,
  });

  const data = await requestJson<{ data: FishListItem[] }>(
    `${API_BASE_URL}/admin/fish${query}`,
    undefined,
    "Failed to fetch admin fish list"
  );

  return data.data || [];
}

export async function getAdminFishById(
  fishId: string | number
): Promise<FishDetailResponse> {
  return requestJson<FishDetailResponse>(
    `${API_BASE_URL}/admin/fish/${fishId}`,
    undefined,
    "Failed to fetch admin fish detail"
  );
}

export async function createFish(payload: FishPayload) {
  return requestJson<{ message: string; data: FishDetailResponse }>(
    `${API_BASE_URL}/admin/fish`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to create fish"
  );
}

export async function updateFish(
  fishId: string | number,
  payload: FishPayload
) {
  return requestJson<{ message: string; data: FishDetailResponse }>(
    `${API_BASE_URL}/admin/fish/${fishId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Failed to update fish"
  );
}

export async function toggleFishStatus(fishId: string | number) {
  return requestJson<{ message: string; data: FishListItem }>(
    `${API_BASE_URL}/admin/fish/${fishId}/status`,
    {
      method: "PATCH",
    },
    "Failed to toggle fish status"
  );
}

export async function deleteFish(fishId: string | number) {
  return requestJson<{ message: string }>(
    `${API_BASE_URL}/admin/fish/${fishId}`,
    {
      method: "DELETE",
    },
    "Failed to delete fish"
  );
}

/* =========================================================
   Admin image APIs
========================================================= */

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<UploadImageResponse>(
    `${API_BASE_URL}/admin/upload-image`,
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload image"
  );
}

export async function getFishImages(
  fishId: string | number
): Promise<FishImageItem[]> {
  const data = await requestJson<{ data: FishImageItem[] }>(
    `${API_BASE_URL}/admin/fish/${fishId}/images`,
    undefined,
    "Failed to fetch fish images"
  );

  return data.data || [];
}

export async function addFishImage(
  fishId: string | number,
  payload: FishImagePayload
) {
  return requestJson<{ message: string; data: FishImageItem }>(
    `${API_BASE_URL}/admin/fish/${fishId}/images`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to add fish image"
  );
}

export async function setFishImageCover(imageId: string | number) {
  return requestJson<{
    message: string;
    data: {
      fish_id: number;
      image_id: number;
      cover_image_url: string;
      fish: FishListItem;
    };
  }>(
    `${API_BASE_URL}/admin/fish/images/${imageId}/cover`,
    {
      method: "PUT",
    },
    "Failed to set cover image"
  );
}

export async function setFishCover(imageId: string | number) {
  return setFishImageCover(imageId);
}

export async function deleteFishImage(imageId: string | number) {
  return requestJson<{ message: string }>(
    `${API_BASE_URL}/admin/fish/images/${imageId}`,
    {
      method: "DELETE",
    },
    "Failed to delete fish image"
  );
}

/* =========================================================
   History APIs
========================================================= */

export async function createHistory(payload: HistoryCreatePayload) {
  return requestJson<{ message: string; data: HistoryItem }>(
    `${API_BASE_URL}/history`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to create history"
  );
}

export async function getHistory(userId: string): Promise<HistoryItem[]> {
  const data = await requestJson<{ data: HistoryItem[] }>(
    `${API_BASE_URL}/history/${userId}`,
    undefined,
    "Failed to fetch history"
  );

  return data.data || [];
}

export async function getPredictionHistory(userId: string): Promise<HistoryItem[]> {
  const data = await requestJson<{ data: HistoryItem[] }>(
    `${API_BASE_URL}/prediction/history/${userId}`,
    undefined,
    "Failed to fetch prediction history"
  );

  return data.data || [];
}

export async function deleteHistory(historyId: string | number) {
  return requestJson<{ message: string }>(
    `${API_BASE_URL}/history/${historyId}`,
    {
      method: "DELETE",
    },
    "Failed to delete history"
  );
}

/* =========================================================
   Profile APIs
========================================================= */

export async function getProfile(userId: string): Promise<Profile> {
  return requestJson<Profile>(
    `${API_BASE_URL}/profile/${userId}`,
    undefined,
    "Failed to fetch profile"
  );
}

export async function updateProfile(
  userId: string,
  payload: ProfileUpdatePayload
) {
  return requestJson<{ message: string; data: Profile | null }>(
    `${API_BASE_URL}/profile/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Failed to update profile"
  );
}

export async function uploadAvatar(userId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<{ message: string; avatar_url: string }>(
    `${API_BASE_URL}/profile/${userId}/avatar`,
    {
      method: "POST",
      body: formData,
    },
    "Failed to upload avatar"
  );
}

export async function changePassword(userId: string, payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}) {
  return requestJson<{ message: string; data?: string }>(
    `${API_BASE_URL}/profile/${userId}/password`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    "Failed to change password"
  );
}

/* =========================================================
   Favorites APIs
========================================================= */

export async function getFavorites(userId: string): Promise<FavoriteItem[]> {
  const data = await requestJson<{ data: FavoriteItem[] }>(
    `${API_BASE_URL}/favorites/${userId}`,
    undefined,
    "Failed to fetch favorites"
  );

  return data.data || [];
}

export async function addFavorite(payload: FavoritePayload) {
  return requestJson<{ message: string; data: FavoriteItem | null }>(
    `${API_BASE_URL}/favorites`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Failed to add favorite"
  );
}

export async function removeFavorite(userId: string, fishId: number) {
  return requestJson<{ message: string }>(
    `${API_BASE_URL}/favorites/${userId}/${fishId}`,
    {
      method: "DELETE",
    },
    "Failed to remove favorite"
  );
}

/* =========================================================
   Utility helpers for frontend matching
========================================================= */

export function normalizeFishName(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findFishByPrediction(
  fishList: FishListItem[],
  predictedName: string
): FishListItem | null {
  const normalizedPrediction = normalizeFishName(predictedName);

  return (
    fishList.find((fish) => normalizeFishName(fish.name) === normalizedPrediction) ||
    fishList.find((fish) => normalizeFishName(fish.slug) === normalizedPrediction) ||
    fishList.find((fish) => normalizeFishName(fish.name).includes(normalizedPrediction)) ||
    fishList.find((fish) => normalizeFishName(fish.slug).includes(normalizedPrediction)) ||
    null
  );
}