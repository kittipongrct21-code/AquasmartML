import io
import os
import re
import uuid
import time
import traceback
from pathlib import Path
from typing import Optional, Callable, Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

from app.services.prediction_service import prediction_service

# =========================================================
# Patch httpx to disable SSL verification for local development
# This resolves "Hostname mismatch" SSL errors with Supabase
# =========================================================
original_client = httpx.Client
def patched_client(*args, **kwargs):
    kwargs['verify'] = False
    return original_client(*args, **kwargs)
httpx.Client = patched_client

original_async_client = httpx.AsyncClient
def patched_async_client(*args, **kwargs):
    kwargs['verify'] = False
    return original_async_client(*args, **kwargs)
httpx.AsyncClient = patched_async_client

# =========================================================
# Environment
# =========================================================
# IMPORTANT:
# - Backend must read secrets from aquasmart-backend/.env
# - Do NOT hardcode Supabase keys in source code
# - If you add more environment variables later, define them here
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "fish-images")
SUPABASE_AVATAR_BUCKET = os.getenv("SUPABASE_AVATAR_BUCKET", "avatars")
SUPABASE_PREDICTION_BUCKET = os.getenv(
    "SUPABASE_PREDICTION_BUCKET",
    "prediction-history",
)
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env")


# =========================================================
# Constants
# =========================================================
# If you add more supported image types later, update this map
IMAGE_MIME_TO_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


# =========================================================
# Supabase helpers
# =========================================================
def get_supabase():
    """
    Create a fresh Supabase client for each operation.
    This helps reduce issues when long-lived connections get interrupted.
    """
    return create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)

def get_supabase_auth_client():
    return create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY or SUPABASE_SECRET_KEY,
    )

def get_supabase_auth_client():
    """
    Client for end-user auth operations such as sign_in_with_password.
    Prefer SUPABASE_ANON_KEY for password verification.
    Fallback to secret key only if anon key is not configured.
    """
    return create_client(
        SUPABASE_URL,
        SUPABASE_ANON_KEY or SUPABASE_SECRET_KEY,
    )

def run_query(
    label: str,
    builder_factory: Callable[[Any], Any],
    retries: int = 3,
    base_delay: float = 0.6,
):
    """
    Run a PostgREST query builder with retry support.

    IMPORTANT:
    - builder_factory must return a query builder
    - DO NOT call .execute() inside builder_factory
    - run_query() will call .execute() itself
    """
    last_error = None

    for attempt in range(retries):
        client = get_supabase()

        try:
            return builder_factory(client).execute()

        except (
            httpx.RemoteProtocolError,
            httpx.ConnectError,
            httpx.ReadError,
            httpx.ReadTimeout,
            httpx.TransportError,
        ) as e:
            last_error = e
            print(f"[WARN] {label} attempt {attempt + 1}/{retries} failed: {e}")
            traceback.print_exc()

            if attempt < retries - 1:
                time.sleep(base_delay * (attempt + 1))
                continue

        except Exception as e:
            print(f"[ERROR] {label}: {e}")
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"{label} failed: {str(e)}",
            )

    raise HTTPException(
        status_code=503,
        detail=f"{label} failed: Supabase connection interrupted ({last_error})",
    )


def parse_public_url(value):
    """
    Normalize Supabase public URL responses into a single string.
    Different library versions may return different shapes.
    """
    if isinstance(value, str):
        return value

    if isinstance(value, dict):
        return (
            value.get("publicURL")
            or value.get("publicUrl")
            or (value.get("data") or {}).get("publicUrl")
            or (value.get("data") or {}).get("publicURL")
        )

    return None


def safe_model_dump(model: BaseModel | dict | None) -> dict:
    """
    Support Pydantic v2 and keep compatibility if needed.
    """
    if model is None:
        return {}

    if isinstance(model, dict):
        return model

    if hasattr(model, "model_dump"):
        return model.model_dump(exclude_none=True)

    if hasattr(model, "dict"):
        return model.dict(exclude_none=True)

    return {}


def sanitize_update_data(data: dict, keep_keys: Optional[set[str]] = None) -> dict:
    """
    Remove None values.
    Optionally keep only allowed keys.
    """
    cleaned = {k: v for k, v in data.items() if v is not None}

    if keep_keys is not None:
        cleaned = {k: v for k, v in cleaned.items() if k in keep_keys}

    return cleaned


def upload_bytes_to_bucket(
    bucket_name: str,
    file_path: str,
    contents: bytes,
    content_type: str,
    upsert: bool = True,
):
    """
    Upload raw bytes to Supabase storage and return a public URL.

    NOTE FOR FUTURE:
    - If you later want signed/private URLs, change this helper here
    - All upload endpoints can keep reusing this helper
    """
    try:
        client = get_supabase()

        client.storage.from_(bucket_name).upload(
            path=file_path,
            file=contents,
            file_options={
                "content-type": content_type,
                "upsert": "true" if upsert else "false",
            },
        )

        public_url = client.storage.from_(bucket_name).get_public_url(file_path)
        public_url = parse_public_url(public_url)

        return {
            "bucket": bucket_name,
            "path": file_path,
            "public_url": public_url,
        }

    except Exception as e:
        print(f"[ERROR] storage upload failed ({bucket_name}): {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Storage upload failed: {str(e)}",
        )


def extract_auth_user(auth_response):
    """
    Normalize Supabase auth responses into a stable structure.

    NOTE FOR FUTURE:
    - If Supabase response shape changes, update this helper only
    """
    user = getattr(auth_response, "user", None)
    session = getattr(auth_response, "session", None)

    if user is None and isinstance(auth_response, dict):
        user = auth_response.get("user")
        session = auth_response.get("session")

    if user is None and session is not None:
        user = getattr(session, "user", None)

    user_id = None
    email = None
    access_token = None
    refresh_token = None

    if user is not None:
        user_id = getattr(user, "id", None) if not isinstance(user, dict) else user.get("id")
        email = getattr(user, "email", None) if not isinstance(user, dict) else user.get("email")

    if session is not None:
        access_token = (
            getattr(session, "access_token", None)
            if not isinstance(session, dict)
            else session.get("access_token")
        )
        refresh_token = (
            getattr(session, "refresh_token", None)
            if not isinstance(session, dict)
            else session.get("refresh_token")
        )

    return {
        "user_id": user_id,
        "email": email,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "raw_user": user,
        "raw_session": session,
    }


def normalize_label(value: Optional[str]) -> str:
    """
    Normalize labels so model class names can match fish_species.name / slug.
    """
    if not value:
        return ""

    value = value.lower().strip()
    value = value.replace("_", " ").replace("-", " ")
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def guess_extension(file_name: Optional[str], content_type: Optional[str]) -> str:
    """
    Choose a safe file extension for uploads.

    NOTE FOR FUTURE:
    - If you support more file types later, update IMAGE_MIME_TO_EXT
    """
    if content_type in IMAGE_MIME_TO_EXT:
        return IMAGE_MIME_TO_EXT[content_type]

    if file_name and "." in file_name:
        ext = Path(file_name).suffix.lower()
        if ext:
            return ext

    return ".bin"


# =========================================================
# FastAPI app
# =========================================================
app = FastAPI(title="AquaSmart ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://aquasmart-ml-w6nr.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Schemas
# =========================================================
# NOTE FOR FUTURE:
# - If you add more request payloads later, define them here
# - Keep payload models grouped by feature section
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
    origin: Optional[str] = None
    name_th: Optional[str] = None
    short_description_th: Optional[str] = None
    type_th: Optional[str] = None
    category_th: Optional[str] = None
    habitat_th: Optional[str] = None
    identify_text_th: Optional[str] = None
    origin_th: Optional[str] = None


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
    feeding_amount: Optional[str] = None
    compatible_species: Optional[str] = None
    growth_rate: Optional[str] = None
    common_diseases: Optional[str] = None
    disease_prevention: Optional[str] = None
    source_type: Optional[str] = None
    source_size: Optional[str] = None
    system_type: Optional[str] = None
    incompatible_species: Optional[str] = None
    survival_rate: Optional[str] = None
    notes: Optional[str] = None
    how_to_raise_th: Optional[str] = None
    pond_type_th: Optional[str] = None
    pond_size_th: Optional[str] = None
    population_per_pond_th: Optional[str] = None
    water_temp_th: Optional[str] = None
    ph_th: Optional[str] = None
    water_prep_th: Optional[str] = None
    recommended_food_th: Optional[str] = None
    not_recommended_food_th: Optional[str] = None
    feeding_frequency_th: Optional[str] = None
    feeding_amount_th: Optional[str] = None
    compatible_species_th: Optional[str] = None
    growth_rate_th: Optional[str] = None
    common_diseases_th: Optional[str] = None
    disease_prevention_th: Optional[str] = None
    source_type_th: Optional[str] = None
    source_size_th: Optional[str] = None
    system_type_th: Optional[str] = None
    incompatible_species_th: Optional[str] = None
    survival_rate_th: Optional[str] = None
    notes_th: Optional[str] = None


class FishOrnamentalSchema(BaseModel):
    environment: Optional[str] = None
    population: Optional[str] = None
    water_temp: Optional[str] = None
    ph: Optional[str] = None
    preparation: Optional[str] = None
    recommended_food: Optional[str] = None
    feeding_frequency: Optional[str] = None
    feeding_amount: Optional[str] = None
    source_type: Optional[str] = None
    source_size: Optional[str] = None
    compatible_species: Optional[str] = None
    growth_rate: Optional[str] = None
    common_diseases: Optional[str] = None
    disease_prevention: Optional[str] = None
    system_type: Optional[str] = None
    incompatible_species: Optional[str] = None
    survival_rate: Optional[str] = None
    not_recommended_food: Optional[str] = None
    notes: Optional[str] = None
    environment_th: Optional[str] = None
    population_th: Optional[str] = None
    water_temp_th: Optional[str] = None
    ph_th: Optional[str] = None
    preparation_th: Optional[str] = None
    recommended_food_th: Optional[str] = None
    feeding_frequency_th: Optional[str] = None
    feeding_amount_th: Optional[str] = None
    source_type_th: Optional[str] = None
    source_size_th: Optional[str] = None
    compatible_species_th: Optional[str] = None
    growth_rate_th: Optional[str] = None
    common_diseases_th: Optional[str] = None
    disease_prevention_th: Optional[str] = None
    system_type_th: Optional[str] = None
    incompatible_species_th: Optional[str] = None
    survival_rate_th: Optional[str] = None
    not_recommended_food_th: Optional[str] = None
    notes_th: Optional[str] = None


class FishPayload(BaseModel):
    general: FishGeneralSchema
    farmer: Optional[FishFarmerSchema] = None
    ornamental: Optional[FishOrnamentalSchema] = None


class FishImagePayload(BaseModel):
    image_url: str
    alt_text: Optional[str] = None
    is_cover: bool = False


class ProfileUpdatePayload(BaseModel):
    email: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = None


class PasswordChangePayload(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class AuthSignupPayload(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None


class AuthLoginPayload(BaseModel):
    email: str
    password: str


class HistoryCreatePayload(BaseModel):
    user_id: str
    fish_id: Optional[int] = None
    fish_name: Optional[str] = None
    predicted_class: str
    raw_predicted_class: Optional[str] = None
    confidence_percent: Optional[float] = None
    prediction_type: Optional[str] = None
    result_json: dict
    uploaded_image_url: Optional[str] = None
    image_url: Optional[str] = None


class FavoritePayload(BaseModel):
    user_id: str
    fish_id: int


# =========================================================
# Fish helpers
# =========================================================
# NOTE FOR FUTURE:
# - If you add fish tags / habitats / more info tables later,
#   keep fish-related helper logic in this section
def set_cover_image_for_fish(fish_id: int, image_id: int, image_url: str):
    """
    1) Unset old cover
    2) Set selected image as cover
    3) Sync fish_species.cover_image_url
    """
    run_query(
        "unset old cover flags",
        lambda db: db.table("fish_images")
        .update({"is_cover": False})
        .eq("fish_id", fish_id),
    )

    run_query(
        "set new cover",
        lambda db: db.table("fish_images")
        .update({"is_cover": True})
        .eq("id", image_id)
        .eq("fish_id", fish_id),
    )

    run_query(
        "sync cover url to fish_species",
        lambda db: db.table("fish_species")
        .update({"cover_image_url": image_url})
        .eq("id", fish_id),
    )


def upsert_cover_image(
    fish_id: int,
    image_url: Optional[str],
    fish_name: Optional[str] = None,
):
    """
    Keep fish_species.cover_image_url and fish_images cover row in sync.

    Used when create/update fish directly sets cover_image_url.
    """
    if not image_url:
        run_query(
            "clear cover flags for fish",
            lambda db: db.table("fish_images")
            .update({"is_cover": False})
            .eq("fish_id", fish_id),
        )

        run_query(
            "clear fish_species cover_image_url",
            lambda db: db.table("fish_species")
            .update({"cover_image_url": None})
            .eq("id", fish_id),
        )
        return

    payload = {
        "fish_id": fish_id,
        "image_url": image_url,
        "alt_text": f"{fish_name} cover" if fish_name else "Fish cover",
        "is_cover": True,
    }

    existing_cover = run_query(
        "find existing cover image",
        lambda db: db.table("fish_images")
        .select("id")
        .eq("fish_id", fish_id)
        .eq("is_cover", True)
        .limit(1),
    )

    existing_rows = existing_cover.data or []

    if existing_rows:
        cover_id = existing_rows[0]["id"]

        run_query(
            "update existing cover image",
            lambda db: db.table("fish_images")
            .update(payload)
            .eq("id", cover_id),
        )
    else:
        inserted = run_query(
            "insert new cover image",
            lambda db: db.table("fish_images").insert(payload),
        )

        inserted_rows = inserted.data or []

        if inserted_rows:
            set_cover_image_for_fish(
                fish_id=fish_id,
                image_id=inserted_rows[0]["id"],
                image_url=image_url,
            )
            return

    run_query(
        "sync cover_image_url to fish_species",
        lambda db: db.table("fish_species")
        .update({"cover_image_url": image_url})
        .eq("id", fish_id),
    )


def get_fish_full_detail_by_id(fish_id: int):
    """
    Return fish + farmer info + ornamental info + image list.
    """
    fish = run_query(
        "fish_species detail",
        lambda db: db.table("fish_species")
        .select("*")
        .eq("id", fish_id)
        .maybe_single(),
    )

    if not fish.data:
        return None

    try:
        farmer = run_query(
            "fish_farmer_info detail",
            lambda db: db.table("fish_farmer_info")
            .select("*")
            .eq("fish_id", fish_id)
            .maybe_single(),
        )
        farmer_data = farmer.data
    except HTTPException:
        farmer_data = None

    try:
        ornamental = run_query(
            "fish_ornamental_info detail",
            lambda db: db.table("fish_ornamental_info")
            .select("*")
            .eq("fish_id", fish_id)
            .maybe_single(),
        )
        ornamental_data = ornamental.data
    except HTTPException:
        ornamental_data = None

    try:
        images = run_query(
            "fish_images list",
            lambda db: db.table("fish_images")
            .select("*")
            .eq("fish_id", fish_id)
            .order("id"),
        )
        images_data = images.data or []
    except HTTPException:
        images_data = []

    return {
        "fish": fish.data,
        "farmer_info": farmer_data,
        "ornamental_info": ornamental_data,
        "images": images_data,
    }


def find_matching_fish_from_prediction(label: Optional[str]):
    """
    Try to match model output against fish_species.name or fish_species.slug.

    IMPORTANT:
    - run_query() already executes the query
    - do NOT call .execute() inside the lambda
    """
    normalized_target = normalize_label(label)
    if not normalized_target:
        return None

    all_fish = run_query(
        "find fish for prediction match",
        lambda db: db.table("fish_species").select("id,name,slug"),
    ).data or []

    # Exact match first
    for fish in all_fish:
        if normalize_label(fish.get("name")) == normalized_target:
            return fish
        if normalize_label(fish.get("slug")) == normalized_target:
            return fish

    # Partial fallback
    for fish in all_fish:
        if normalized_target in normalize_label(fish.get("name")):
            return fish
        if normalized_target in normalize_label(fish.get("slug")):
            return fish

    return None


def save_prediction_history_record(
    *,
    user_id: str,
    result: dict,
    uploaded_image_url: Optional[str] = None,
):
    """
    Save normalized prediction result into prediction_history.

    NOTE FOR FUTURE:
    - If you later add top-k predictions or model version tracking,
      extend this payload here
    """
    predicted_class = result.get("predicted_class")
    raw_predicted_class = result.get("raw_predicted_class") or predicted_class
    confidence_percent = result.get("confidence_percent")
    prediction_type = result.get("prediction_type") or "known_fish"

    matched_fish = find_matching_fish_from_prediction(raw_predicted_class)

    payload = {
        "user_id": user_id,
        "uploaded_image_url": uploaded_image_url,
        "predicted_class": predicted_class,
        "confidence_percent": confidence_percent,
        "result_json": result,
        "fish_id": matched_fish.get("id") if matched_fish else None,
        "fish_name": matched_fish.get("name") if matched_fish else None,
        "raw_predicted_class": raw_predicted_class,
        "prediction_type": prediction_type,
        "image_url": uploaded_image_url,
    }

    run_query(
        "save prediction history",
        lambda db: db.table("prediction_history").insert(payload),
    )


# =========================================================
# Root / Health
# =========================================================
@app.get("/")
def root():
    return {"message": "AquaSmart ML API is running"}


@app.get("/health")
def health():
    """
    Health check for frontend and local debugging.
    """
    return {
        "status": "ok",
        "model_loaded": prediction_service.is_loaded(),
        "model_error": prediction_service.model_load_error,
        "classes": prediction_service.class_names,
    }


# =========================================================
# Public fish endpoints
# =========================================================
@app.get("/fish")
def get_fish(q: Optional[str] = None):
    def build_query(db):
        query = db.table("fish_species").select("*").eq("is_active", True).order("id")

        if q:
            keyword = q.strip()
            if keyword:
                query = query.or_(f"name.ilike.%{keyword}%,slug.ilike.%{keyword}%")

        return query

    response = run_query("public fish list", build_query)
    return {"data": response.data or []}


@app.get("/fish/{fish_id}")
def get_public_fish_by_id(fish_id: int):
    data = get_fish_full_detail_by_id(fish_id)

    if not data:
        raise HTTPException(status_code=404, detail="Fish not found")

    if not data["fish"].get("is_active"):
        raise HTTPException(status_code=404, detail="Fish not found")

    return data


# =========================================================
# Prediction endpoint
# =========================================================
@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
):
    """
    Run model prediction.
    If user_id is provided:
    - upload input image to prediction-history bucket
    - save a prediction_history record
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read contents once so we can:
    # 1) predict from memory
    # 2) optionally upload the same bytes for history
    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    # Create a memory-based UploadFile for prediction service
    memory_file = UploadFile(
        file=io.BytesIO(contents),
        filename=file.filename or "upload",
        headers=file.headers,
    )

    result = await prediction_service.predict_upload(memory_file)

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=500,
            detail="Prediction service returned invalid response",
        )

    if user_id:
        uploaded_image_url = None

        try:
            ext = guess_extension(file.filename, file.content_type)
            file_path = f"{user_id}/{uuid.uuid4().hex}{ext}"

            uploaded = upload_bytes_to_bucket(
                bucket_name=SUPABASE_PREDICTION_BUCKET,
                file_path=file_path,
                contents=contents,
                content_type=file.content_type,
                upsert=True,
            )

            uploaded_image_url = uploaded.get("public_url")
        except Exception as e:
            # Prediction should still succeed even if history image upload fails
            print(f"[WARN] prediction image upload failed: {e}")
            traceback.print_exc()

        try:
            save_prediction_history_record(
                user_id=user_id,
                result=result,
                uploaded_image_url=uploaded_image_url,
            )
        except Exception as e:
            # Prediction should still succeed even if history insert fails
            print(f"[WARN] save prediction history failed: {e}")
            traceback.print_exc()

    return result


# =========================================================
# Admin fish endpoints
# =========================================================
# NOTE FOR FUTURE:
# - If admin auth is added later, apply auth/permission checks here
@app.get("/admin/fish")
def admin_get_fish(
    q: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    fish_type: Optional[str] = None,
):
    def build_query(db):
        query = db.table("fish_species").select("*").order("id")

        if q:
            keyword = q.strip()
            if keyword:
                query = query.or_(f"name.ilike.%{keyword}%,slug.ilike.%{keyword}%")

        if status == "active":
            query = query.eq("is_active", True)
        elif status == "inactive":
            query = query.eq("is_active", False)

        if category:
            query = query.ilike("category", f"%{category.strip()}%")

        if fish_type:
            query = query.ilike("type", f"%{fish_type.strip()}%")

        return query

    response = run_query("admin fish list", build_query)
    return {"data": response.data or []}


@app.get("/admin/fish/{fish_id}")
def admin_get_fish_by_id(fish_id: int):
    data = get_fish_full_detail_by_id(fish_id)

    if not data:
        raise HTTPException(status_code=404, detail="Fish not found")

    return data


@app.post("/admin/fish")
def admin_create_fish(payload: FishPayload):
    general_data = safe_model_dump(payload.general)

    fish_response = run_query(
        "create fish_species",
        lambda db: db.table("fish_species").insert(general_data),
    )

    if not fish_response.data:
        raise HTTPException(status_code=400, detail="Failed to create fish")

    fish = fish_response.data[0]
    fish_id = fish["id"]

    if payload.farmer:
        farmer_data = safe_model_dump(payload.farmer)
        farmer_data["fish_id"] = fish_id

        run_query(
            "create fish_farmer_info",
            lambda db: db.table("fish_farmer_info").insert(farmer_data),
        )

    if payload.ornamental:
        ornamental_data = safe_model_dump(payload.ornamental)
        ornamental_data["fish_id"] = fish_id

        run_query(
            "create fish_ornamental_info",
            lambda db: db.table("fish_ornamental_info").insert(ornamental_data),
        )

    upsert_cover_image(
        fish_id=fish_id,
        image_url=general_data.get("cover_image_url"),
        fish_name=general_data.get("name"),
    )

    return {
        "message": "Fish created successfully",
        "data": get_fish_full_detail_by_id(fish_id),
    }


@app.put("/admin/fish/{fish_id}")
def admin_update_fish(fish_id: int, payload: FishPayload):
    existing = run_query(
        "check fish exists before update",
        lambda db: db.table("fish_species")
        .select("id")
        .eq("id", fish_id)
        .maybe_single(),
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Fish not found")

    general_data = safe_model_dump(payload.general)

    run_query(
        "update fish_species",
        lambda db: db.table("fish_species")
        .update(general_data)
        .eq("id", fish_id),
    )

    if payload.farmer:
        farmer_data = safe_model_dump(payload.farmer)
        farmer_data["fish_id"] = fish_id

        farmer_check = run_query(
            "check fish_farmer_info exists",
            lambda db: db.table("fish_farmer_info")
            .select("id")
            .eq("fish_id", fish_id)
            .maybe_single(),
        )

        if farmer_check.data:
            run_query(
                "update fish_farmer_info",
                lambda db: db.table("fish_farmer_info")
                .update(farmer_data)
                .eq("fish_id", fish_id),
            )
        else:
            run_query(
                "insert fish_farmer_info",
                lambda db: db.table("fish_farmer_info").insert(farmer_data),
            )

    if payload.ornamental:
        ornamental_data = safe_model_dump(payload.ornamental)
        ornamental_data["fish_id"] = fish_id

        ornamental_check = run_query(
            "check fish_ornamental_info exists",
            lambda db: db.table("fish_ornamental_info")
            .select("id")
            .eq("fish_id", fish_id)
            .maybe_single(),
        )

        if ornamental_check.data:
            run_query(
                "update fish_ornamental_info",
                lambda db: db.table("fish_ornamental_info")
                .update(ornamental_data)
                .eq("fish_id", fish_id),
            )
        else:
            run_query(
                "insert fish_ornamental_info",
                lambda db: db.table("fish_ornamental_info").insert(ornamental_data),
            )

    upsert_cover_image(
        fish_id=fish_id,
        image_url=general_data.get("cover_image_url"),
        fish_name=general_data.get("name"),
    )

    return {
        "message": "Fish updated successfully",
        "data": get_fish_full_detail_by_id(fish_id),
    }


@app.patch("/admin/fish/{fish_id}/status")
def admin_toggle_fish_status(fish_id: int):
    existing = run_query(
        "check fish exists before status toggle",
        lambda db: db.table("fish_species")
        .select("id, is_active")
        .eq("id", fish_id)
        .maybe_single(),
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Fish not found")

    new_status = not bool(existing.data.get("is_active"))

    updated = run_query(
        "toggle fish status",
        lambda db: db.table("fish_species")
        .update({"is_active": new_status})
        .eq("id", fish_id),
    )

    return {
        "message": "Fish status updated successfully",
        "data": updated.data[0] if updated.data else {
            "id": fish_id,
            "is_active": new_status,
        },
    }


@app.delete("/admin/fish/{fish_id}")
def admin_delete_fish(fish_id: int):
    existing = run_query(
        "check fish exists before delete",
        lambda db: db.table("fish_species")
        .select("id")
        .eq("id", fish_id)
        .maybe_single(),
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="Fish not found")

    run_query(
        "delete fish_images by fish_id",
        lambda db: db.table("fish_images").delete().eq("fish_id", fish_id),
    )

    run_query(
        "delete fish_farmer_info by fish_id",
        lambda db: db.table("fish_farmer_info").delete().eq("fish_id", fish_id),
    )

    run_query(
        "delete fish_ornamental_info by fish_id",
        lambda db: db.table("fish_ornamental_info").delete().eq("fish_id", fish_id),
    )

    run_query(
        "delete fish_species",
        lambda db: db.table("fish_species").delete().eq("id", fish_id),
    )

    return {"message": "Fish deleted successfully"}


# =========================================================
# Admin image endpoints
# =========================================================
@app.post("/admin/upload-image")
async def admin_upload_image(file: UploadFile = File(...)):
    if file.content_type not in IMAGE_MIME_TO_EXT:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    ext = IMAGE_MIME_TO_EXT[file.content_type]
    file_name = f"{uuid.uuid4().hex}{ext}"
    file_path = f"fish-covers/{file_name}"

    uploaded = upload_bytes_to_bucket(
        bucket_name=SUPABASE_STORAGE_BUCKET,
        file_path=file_path,
        contents=contents,
        content_type=file.content_type,
        upsert=True,
    )

    return {
        "message": "Image uploaded successfully",
        **uploaded,
    }


@app.get("/admin/fish/{fish_id}/images")
def admin_get_fish_images(fish_id: int):
    response = run_query(
        "admin fish images",
        lambda db: db.table("fish_images")
        .select("*")
        .eq("fish_id", fish_id)
        .order("id"),
    )

    return {"data": response.data or []}


@app.post("/admin/fish/{fish_id}/images")
def admin_add_fish_image(fish_id: int, payload: FishImagePayload):
    """
    Always insert with is_cover=False first.
    Then set cover in a second step if needed.
    This avoids duplicate-key issues for one-cover-per-fish constraints.
    """
    fish = run_query(
        "check fish exists before add image",
        lambda db: db.table("fish_species")
        .select("id, cover_image_url")
        .eq("id", fish_id)
        .maybe_single(),
    )

    if not fish.data:
        raise HTTPException(status_code=404, detail="Fish not found")

    should_set_cover = bool(payload.is_cover) or not fish.data.get("cover_image_url")

    insert_payload = {
        "fish_id": fish_id,
        "image_url": payload.image_url,
        "alt_text": payload.alt_text or "Fish image",
        "is_cover": False,
    }

    image_response = run_query(
        "insert fish image",
        lambda db: db.table("fish_images").insert(insert_payload),
    )

    if not image_response.data:
        raise HTTPException(status_code=400, detail="Failed to add image")

    image = image_response.data[0]

    if should_set_cover:
        set_cover_image_for_fish(
            fish_id=fish_id,
            image_id=image["id"],
            image_url=image["image_url"],
        )

        refreshed = run_query(
            "get inserted fish image after set cover",
            lambda db: db.table("fish_images")
            .select("*")
            .eq("id", image["id"])
            .maybe_single(),
        )

        image = refreshed.data or image

    return {
        "message": "Image added successfully",
        "data": image,
    }


@app.put("/admin/fish/images/{image_id}/cover")
def admin_set_fish_cover(image_id: int):
    image = run_query(
        "find image",
        lambda db: db.table("fish_images")
        .select("*")
        .eq("id", image_id)
        .maybe_single(),
    )

    if not image.data:
        raise HTTPException(status_code=404, detail="Image not found")

    fish_id = image.data["fish_id"]
    image_url = image.data["image_url"]

    set_cover_image_for_fish(
        fish_id=fish_id,
        image_id=image_id,
        image_url=image_url,
    )

    updated_fish = run_query(
        "get updated fish after set cover",
        lambda db: db.table("fish_species")
        .select("*")
        .eq("id", fish_id)
        .maybe_single(),
    )

    return {
        "message": "Cover image updated successfully",
        "data": {
            "fish_id": fish_id,
            "image_id": image_id,
            "cover_image_url": image_url,
            "fish": updated_fish.data,
        },
    }


@app.delete("/admin/fish/images/{image_id}")
def admin_delete_fish_image(image_id: int):
    image = run_query(
        "find image before delete",
        lambda db: db.table("fish_images")
        .select("*")
        .eq("id", image_id)
        .maybe_single(),
    )

    if not image.data:
        raise HTTPException(status_code=404, detail="Image not found")

    fish_id = image.data["fish_id"]
    was_cover = bool(image.data.get("is_cover"))

    run_query(
        "delete fish image by id",
        lambda db: db.table("fish_images")
        .delete()
        .eq("id", image_id),
    )

    if was_cover:
        remaining = run_query(
            "find remaining fish images after delete",
            lambda db: db.table("fish_images")
            .select("*")
            .eq("fish_id", fish_id)
            .order("id")
            .limit(1),
        )

        remaining_rows = remaining.data or []

        if remaining_rows:
            first_image = remaining_rows[0]

            set_cover_image_for_fish(
                fish_id=fish_id,
                image_id=first_image["id"],
                image_url=first_image["image_url"],
            )
        else:
            run_query(
                "clear fish cover after deleting last image",
                lambda db: db.table("fish_species")
                .update({"cover_image_url": None})
                .eq("id", fish_id),
            )

    return {"message": "Image deleted successfully"}


# =========================================================
# Profile endpoints
# =========================================================
@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    profile = run_query(
        "get profile",
        lambda db: db.table("profiles")
        .select("*")
        .eq("id", user_id)
        .maybe_single(),
    )

    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile.data


@app.put("/profile/{user_id}")
def update_profile(user_id: str, payload: ProfileUpdatePayload):
    allowed_keys = {"email", "display_name", "avatar_url", "role"}
    update_data = sanitize_update_data(safe_model_dump(payload), keep_keys=allowed_keys)

    if not update_data:
        return {"message": "Nothing to update"}

    updated = run_query(
        "update profile",
        lambda db: db.table("profiles")
        .update(update_data)
        .eq("id", user_id),
    )

    return {
        "message": "Profile updated successfully",
        "data": updated.data[0] if updated.data else None,
    }


@app.post("/profile/{user_id}/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    if file.content_type not in IMAGE_MIME_TO_EXT:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    ext = IMAGE_MIME_TO_EXT[file.content_type]
    file_name = f"{uuid.uuid4().hex}{ext}"
    file_path = f"{user_id}/{file_name}"

    uploaded = upload_bytes_to_bucket(
        bucket_name=SUPABASE_AVATAR_BUCKET,
        file_path=file_path,
        contents=contents,
        content_type=file.content_type,
        upsert=True,
    )

    avatar_url = uploaded.get("public_url")

    run_query(
        "update profile avatar",
        lambda db: db.table("profiles")
        .update({"avatar_url": avatar_url})
        .eq("id", user_id),
    )

    return {
        "message": "Avatar uploaded successfully",
        "avatar_url": avatar_url,
    }


@app.put("/profile/{user_id}/password")
def change_password(user_id: str, payload: PasswordChangePayload):
    """
    Change user password with validation.
    """
    if not payload.current_password or not payload.new_password or not payload.confirm_password:
        raise HTTPException(status_code=400, detail="All password fields are required")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirm password do not match")

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password",
        )

    profile = run_query(
        "get profile for password change",
        lambda db: db.table("profiles")
        .select("email")
        .eq("id", user_id)
        .maybe_single(),
    )

    if not profile.data or not profile.data.get("email"):
        raise HTTPException(status_code=404, detail="User profile not found")

    email = profile.data["email"]

    # 1) Verify current password with auth client
    try:
        auth_client = get_supabase_auth_client()
        auth_client.auth.sign_in_with_password(
    {
        "email": email,
        "password": payload.current_password,
    }
    
    )
    except Exception as e:
        print(f"[ERROR] current password verification failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    # 2) Update password with admin-capable client
    try:
        admin_client = get_supabase()
        result = admin_client.auth.admin.update_user_by_id(
            user_id,
            {"password": payload.new_password},
        )

        return {
            "message": "Password updated successfully",
            "data": {
                "user_id": user_id,
                "updated": True,
                "result": str(result),
            },
        }
    except Exception as e:
        print(f"[ERROR] password update failed: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update password: {str(e)}",
        )

# =========================================================
# History endpoints
# =========================================================
# NOTE FOR FUTURE:
# - Keep /history and /prediction/history for frontend compatibility
@app.post("/history")
def create_history(payload: HistoryCreatePayload):
    data = safe_model_dump(payload)

    created = run_query(
        "create history",
        lambda db: db.table("prediction_history").insert(data),
    )

    return {
        "message": "History created successfully",
        "data": created.data[0] if created.data else None,
    }


@app.get("/history/{user_id}")
def get_history(user_id: str):
    history = run_query(
        "get history by user",
        lambda db: db.table("prediction_history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True),
    )
    return {"data": history.data or []}


@app.delete("/history/{history_id}")
def delete_history(history_id: int):
    existing = run_query(
        "check history exists before delete",
        lambda db: db.table("prediction_history")
        .select("id")
        .eq("id", history_id)
        .maybe_single(),
    )

    if not existing.data:
        raise HTTPException(status_code=404, detail="History not found")

    run_query(
        "delete history",
        lambda db: db.table("prediction_history")
        .delete()
        .eq("id", history_id),
    )

    return {"message": "History deleted successfully"}


@app.get("/prediction/history/{user_id}")
def get_prediction_history(user_id: str):
    """
    Alias endpoint for frontend compatibility.
    """
    history = run_query(
        "get prediction history by user",
        lambda db: db.table("prediction_history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True),
    )

    return {"data": history.data or []}


# =========================================================
# Favorites endpoints
# =========================================================
@app.get("/favorites/{user_id}")
def get_favorites(user_id: str):
    favorites = run_query(
        "get favorites by user",
        lambda db: db.table("favorites")
        .select("*, fish_species(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True),
    )

    return {"data": favorites.data or []}


@app.post("/favorites")
def add_favorite(payload: FavoritePayload):
    existing = run_query(
        "check favorite exists",
        lambda db: db.table("favorites")
        .select("id")
        .eq("user_id", payload.user_id)
        .eq("fish_id", payload.fish_id)
        .limit(1),
    )

    if existing.data:
        return {
            "message": "Favorite already exists",
            "data": existing.data[0],
        }

    created = run_query(
        "create favorite",
        lambda db: db.table("favorites").insert(safe_model_dump(payload)),
    )

    return {
        "message": "Favorite added successfully",
        "data": created.data[0] if created.data else None,
    }


@app.delete("/favorites/{user_id}/{fish_id}")
def remove_favorite(user_id: str, fish_id: int):
    run_query(
        "remove favorite",
        lambda db: db.table("favorites")
        .delete()
        .eq("user_id", user_id)
        .eq("fish_id", fish_id),
    )

    return {"message": "Favorite removed successfully"}


# =========================================================
# Auth endpoints
# =========================================================
# NOTE FOR FUTURE:
# - If you later move auth fully to frontend Supabase SDK,
#   keep these endpoints only if backend-controlled auth is still needed
@app.post("/auth/signup")
def signup(payload: AuthSignupPayload):
    """
    Server-side signup.
    Creates auth user and then upserts a profile row.
    """
    try:
        client = get_supabase()
        auth_response = client.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )

        auth_info = extract_auth_user(auth_response)
        user_id = auth_info.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=500,
                detail="Signup succeeded but user id was not returned",
            )

        profile_payload = {
            "id": user_id,
            "email": payload.email,
            "display_name": payload.display_name,
        }

        run_query(
            "upsert profile after signup",
            lambda db: db.table("profiles").upsert(profile_payload),
        )

        return {
            "message": "Signup successful",
            "data": auth_info,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] signup failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")


@app.post("/auth/login")
def login(payload: AuthLoginPayload):
    """
    Server-side login.
    """
    try:
        client = get_supabase()
        auth_response = client.auth.sign_in_with_password(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )

        auth_info = extract_auth_user(auth_response)

        return {
            "message": "Login successful",
            "data": auth_info,
        }

    except Exception as e:
        print(f"[ERROR] login failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")


@app.post("/auth/logout")
def logout():
    """
    Backend is mostly stateless here.
    Frontend can still clear its local auth/session state.
    """
    try:
        client = get_supabase()

        try:
            client.auth.sign_out()
        except Exception:
            # Service-role style backend may not hold a real user session.
            pass

        return {"message": "Logout successful"}

    except Exception as e:
        print(f"[ERROR] logout failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")


# =========================================================
# Windows-safe runner
# =========================================================
if __name__ == "__main__":
    import uvicorn

    # IMPORTANT:
    # - Keep reload=False here for safe direct execution on Windows
    # - For dev hot reload, use command line:
    #   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=False,
    )