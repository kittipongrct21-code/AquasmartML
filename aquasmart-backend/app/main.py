import io
import os
import json
import numpy as np
import tensorflow as tf


from PIL import Image
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from typing import Optional
from pydantic import BaseModel

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

MODEL_PATH = "models/fish_model_inference.keras"

CLASS_NAMES_PATH = "models/class_names.json"
IMG_SIZE = (224, 224)

model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as f:
    class_names = json.load(f)

app = FastAPI(title="AquaSmart ML API")

class FishGeneralSchema(BaseModel):
    name: str
    slug: str
    short_description: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    habitat: Optional[str] = None
    identify_text: Optional[str] = None
    average_lifespan: Optional[str] = None
    adult_size: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_active: bool = True


class FishFarmerSchema(BaseModel):
    how_to_raise: Optional[str] = None
    pond_type: Optional[str] = None
    pond_size: Optional[str] = None
    population_per_pond: Optional[str] = None
    water_temp: Optional[str] = None
    ph: Optional[str] = None
    water_prep: Optional[str] = None
    recommended_food: Optional[str] = None
    not_recommended_food: Optional[str] = None
    feeding_frequency: Optional[str] = None


class FishOrnamentalSchema(BaseModel):
    environment: Optional[str] = None
    population: Optional[str] = None
    water_temp: Optional[str] = None
    ph: Optional[str] = None
    preparation: Optional[str] = None
    recommended_food: Optional[str] = None
    feeding_frequency: Optional[str] = None
    feeding_amount: Optional[str] = None


class FishPayload(BaseModel):
    general: FishGeneralSchema
    farmer: Optional[FishFarmerSchema] = None
    ornamental: Optional[FishOrnamentalSchema] = None

def get_fish_full_detail_by_id(fish_id: int):
    fish = (
        supabase
        .table("fish_species")
        .select("*")
        .eq("id", fish_id)
        .maybe_single()
        .execute()
    )

    if not fish.data:
        return None

    farmer = (
        supabase
        .table("fish_farmer_info")
        .select("*")
        .eq("fish_id", fish_id)
        .maybe_single()
        .execute()
    )

    ornamental = (
        supabase
        .table("fish_ornamental_info")
        .select("*")
        .eq("fish_id", fish_id)
        .maybe_single()
        .execute()
    )

    images = (
        supabase
        .table("fish_images")
        .select("*")
        .eq("fish_id", fish_id)
        .order("id")
        .execute()
    )

    return {
        "fish": fish.data,
        "farmer_info": farmer.data,
        "ornamental_info": ornamental.data,
        "images": images.data
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def preprocess_image(image: Image.Image):
    image = image.convert("RGB")
    image = image.resize(IMG_SIZE)
    arr = np.array(image).astype("float32") / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

@app.get("/")
def root():
    return {"message": "AquaSmart ML API is running"}

@app.get("/fish")
def get_fish():
    response = (
        supabase
        .table("fish_species")
        .select("*")
        .eq("is_active", True)
        .order("id")
        .execute()
    )
    return {"data": response.data}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    input_array = preprocess_image(image)
    preds = model.predict(input_array, verbose=0)[0]

    pred_index = int(np.argmax(preds))
    pred_class = class_names[pred_index]
    confidence = float(preds[pred_index])

    return {
        "predicted_class": pred_class,
        "confidence_percent": round(confidence * 100, 2),
        "all_probabilities": {
            class_names[i]: round(float(preds[i]), 6)
            for i in range(len(class_names))
        }
    }

@app.get("/admin/fish")
def admin_get_fish():
    response = (
        supabase
        .table("fish_species")
        .select("*")
        .order("id")
        .execute()
    )
    return {"data": response.data}


@app.get("/admin/fish/{fish_id}")
def admin_get_fish_by_id(fish_id: int):
    data = get_fish_full_detail_by_id(fish_id)
    if not data:
        raise HTTPException(status_code=404, detail="Fish not found")
    return data


@app.post("/admin/fish")
def admin_create_fish(payload: FishPayload):
    general_data = payload.general.model_dump()

    fish_response = (
        supabase
        .table("fish_species")
        .insert(general_data)
        .execute()
    )

    if not fish_response.data:
        raise HTTPException(status_code=400, detail="Failed to create fish")

    fish = fish_response.data[0]
    fish_id = fish["id"]

    if payload.farmer:
        farmer_data = payload.farmer.model_dump()
        farmer_data["fish_id"] = fish_id
        supabase.table("fish_farmer_info").insert(farmer_data).execute()

    if payload.ornamental:
        ornamental_data = payload.ornamental.model_dump()
        ornamental_data["fish_id"] = fish_id
        supabase.table("fish_ornamental_info").insert(ornamental_data).execute()

    return {
        "message": "Fish created successfully",
        "data": get_fish_full_detail_by_id(fish_id)
    }


@app.put("/admin/fish/{fish_id}")
def admin_update_fish(fish_id: int, payload: FishPayload):
    existing = (
        supabase
        .table("fish_species")
        .select("id")
        .eq("id", fish_id)
        .maybe_single()
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Fish not found")

    general_data = payload.general.model_dump()

    supabase.table("fish_species").update(general_data).eq("id", fish_id).execute()

    if payload.farmer:
        farmer_data = payload.farmer.model_dump()
        farmer_data["fish_id"] = fish_id

        farmer_check = (
            supabase
            .table("fish_farmer_info")
            .select("id")
            .eq("fish_id", fish_id)
            .maybe_single()
            .execute()
        )

        if farmer_check.data:
            supabase.table("fish_farmer_info").update(farmer_data).eq("fish_id", fish_id).execute()
        else:
            supabase.table("fish_farmer_info").insert(farmer_data).execute()

    if payload.ornamental:
        ornamental_data = payload.ornamental.model_dump()
        ornamental_data["fish_id"] = fish_id

        ornamental_check = (
            supabase
            .table("fish_ornamental_info")
            .select("id")
            .eq("fish_id", fish_id)
            .maybe_single()
            .execute()
        )

        if ornamental_check.data:
            supabase.table("fish_ornamental_info").update(ornamental_data).eq("fish_id", fish_id).execute()
        else:
            supabase.table("fish_ornamental_info").insert(ornamental_data).execute()

    return {
        "message": "Fish updated successfully",
        "data": get_fish_full_detail_by_id(fish_id)
    }


@app.delete("/admin/fish/{fish_id}")
def admin_delete_fish(fish_id: int):
    existing = (
        supabase
        .table("fish_species")
        .select("id")
        .eq("id", fish_id)
        .maybe_single()
        .execute()
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Fish not found")

    # delete child records first
    supabase.table("fish_images").delete().eq("fish_id", fish_id).execute()
    supabase.table("fish_farmer_info").delete().eq("fish_id", fish_id).execute()
    supabase.table("fish_ornamental_info").delete().eq("fish_id", fish_id).execute()

    # then delete parent
    supabase.table("fish_species").delete().eq("id", fish_id).execute()

    return {"message": "Fish deleted successfully"}