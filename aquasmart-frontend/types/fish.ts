export type FishGeneral = {
  name: string;
  slug: string;
  short_description?: string;
  type?: string;
  category?: string;
  habitat?: string;
  identify_text?: string;
  average_lifespan?: string;
  adult_size?: string;
  cover_image_url?: string;
  is_active: boolean;
  origin?: string;
};

export type FishFarmer = {
  how_to_raise?: string;
  pond_type?: string;
  pond_size?: string;
  population_per_pond?: string;
  water_temp?: string;
  ph?: string;
  water_prep?: string;
  recommended_food?: string;
  not_recommended_food?: string;
  feeding_frequency?: string;
  feeding_amount?: string;
  compatible_species?: string;
  growth_rate?: string;
  common_diseases?: string;
  disease_prevention?: string;
  source_type?: string;
  source_size?: string;
  system_type?: string;
  incompatible_species?: string;
  survival_rate?: string;
  notes?: string;
};

export type FishOrnamental = {
  environment?: string;
  population?: string;
  water_temp?: string;
  ph?: string;
  preparation?: string;
  recommended_food?: string;
  feeding_frequency?: string;
  feeding_amount?: string;
  source_type?: string;
  source_size?: string;
  compatible_species?: string;
  growth_rate?: string;
  common_diseases?: string;
  disease_prevention?: string;
  system_type?: string;
  incompatible_species?: string;
  survival_rate?: string;
  not_recommended_food?: string;
  notes?: string;
};

export type FishPayload = {
  general: FishGeneral;
  farmer?: FishFarmer;
  ornamental?: FishOrnamental;
};

export type FishSpeciesRow = {
  id: number;
  name: string;
  slug: string;
  short_description?: string;
  type?: string;
  category?: string;
  habitat?: string;
  identify_text?: string;
  average_lifespan?: string;
  adult_size?: string;
  cover_image_url?: string;
  is_active: boolean;
  origin?: string;
  created_at?: string;
  updated_at?: string;
};

export type FishImageRow = {
  id: number;
  fish_id: number;
  image_url: string;
  alt_text?: string;
  is_cover: boolean;
  created_at?: string;
};

export type FishDetailResponse = {
  fish: FishSpeciesRow;
  farmer_info?: FishFarmer | null;
  ornamental_info?: FishOrnamental | null;
  images?: FishImageRow[];
};