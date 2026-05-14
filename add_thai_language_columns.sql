-- ==============================================================================
-- Migration: Add Thai language columns to Fish tables
-- ==============================================================================

-- 1. Table: fish_species
ALTER TABLE public.fish_species
ADD COLUMN name_th text,
ADD COLUMN short_description_th text,
ADD COLUMN type_th text,
ADD COLUMN category_th text,
ADD COLUMN habitat_th text,
ADD COLUMN identify_text_th text,
ADD COLUMN origin_th text;

-- 2. Table: fish_farmer_info
ALTER TABLE public.fish_farmer_info
ADD COLUMN how_to_raise_th text,
ADD COLUMN pond_type_th text,
ADD COLUMN pond_size_th text,
ADD COLUMN population_per_pond_th text,
ADD COLUMN water_temp_th text,
ADD COLUMN ph_th text,
ADD COLUMN water_prep_th text,
ADD COLUMN recommended_food_th text,
ADD COLUMN not_recommended_food_th text,
ADD COLUMN feeding_frequency_th text,
ADD COLUMN feeding_amount_th text,
ADD COLUMN compatible_species_th text,
ADD COLUMN growth_rate_th text,
ADD COLUMN common_diseases_th text,
ADD COLUMN disease_prevention_th text,
ADD COLUMN source_type_th text,
ADD COLUMN source_size_th text,
ADD COLUMN system_type_th text,
ADD COLUMN incompatible_species_th text,
ADD COLUMN survival_rate_th text,
ADD COLUMN notes_th text;

-- 3. Table: fish_ornamental_info
ALTER TABLE public.fish_ornamental_info
ADD COLUMN environment_th text,
ADD COLUMN population_th text,
ADD COLUMN water_temp_th text,
ADD COLUMN ph_th text,
ADD COLUMN preparation_th text,
ADD COLUMN recommended_food_th text,
ADD COLUMN feeding_frequency_th text,
ADD COLUMN feeding_amount_th text,
ADD COLUMN source_type_th text,
ADD COLUMN source_size_th text,
ADD COLUMN compatible_species_th text,
ADD COLUMN growth_rate_th text,
ADD COLUMN common_diseases_th text,
ADD COLUMN disease_prevention_th text,
ADD COLUMN system_type_th text,
ADD COLUMN incompatible_species_th text,
ADD COLUMN survival_rate_th text,
ADD COLUMN not_recommended_food_th text,
ADD COLUMN notes_th text;

-- หมายเหตุ: คอลัมน์ slug ใน fish_species ไม่ต้องทำ _th เพราะมักใช้เป็น URL ภาษาอังกฤษเพื่อความเสถียร
