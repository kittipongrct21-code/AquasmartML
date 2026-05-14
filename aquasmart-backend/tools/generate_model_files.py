import json
from pathlib import Path

from tensorflow import keras

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

MODEL_PATH = MODEL_DIR / "fish_model_inference.keras"
CLASS_NAMES_PATH = MODEL_DIR / "class_names.json"
MODEL_CONFIG_PATH = MODEL_DIR / "model_config.json"
THRESHOLDS_PATH = MODEL_DIR / "thresholds.json"


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found: {MODEL_PATH}")

    print(f"[INFO] Loading model: {MODEL_PATH}")
    model = keras.models.load_model(str(MODEL_PATH))

    class_names = [
        "Bangus",
        "Black Spotted Barb",
        "Catfish",
        "Fourfinger Threadfin",
        "Gold Fish",
        "Gourami",
        "Green Spotted Puffer",
        "Jaguar Gapote",
        "Knifefish",
        "Snakehead",
        "not_a_fish"
    ]

    with open(CLASS_NAMES_PATH, "w", encoding="utf-8") as f:
        json.dump(class_names, f, ensure_ascii=False, indent=2)

    model_config = {
        "project": "AquaSmart ML",
        "task": "classification",
        "framework": "tensorflow",
        "architecture": "keras",
        "model_file": "fish_model_inference.keras",
        "class_names_file": "class_names.json",
        "image_size": 320,
        "rgb": True,
        "top_k": 3,
        "labels": class_names
    }

    with open(MODEL_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(model_config, f, ensure_ascii=False, indent=2)

    thresholds = {
        "known_fish_min_confidence": 0.70,
        "unknown_fish_max_confidence": 0.70,
        "top1_top2_min_margin": 0.12,
        "not_a_fish_enabled": False,
        "not_a_fish_mode": "heuristic_fallback_only"
    }

    with open(THRESHOLDS_PATH, "w", encoding="utf-8") as f:
        json.dump(thresholds, f, ensure_ascii=False, indent=2)

    print("[SUCCESS] Generated files:")
    print(f" - {CLASS_NAMES_PATH}")
    print(f" - {MODEL_CONFIG_PATH}")
    print(f" - {THRESHOLDS_PATH}")

    print("\n[CLASS NAMES]")
    for i, name in enumerate(class_names):
        print(f"{i}: {name}")


if __name__ == "__main__":
    main()