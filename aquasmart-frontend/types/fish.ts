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
  created_at?: string;
  updated_at?: string;
};