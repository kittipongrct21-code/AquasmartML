import json
import traceback
from io import BytesIO
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException, UploadFile
from PIL import Image
from ultralytics import YOLO


class PredictionService:
    """
    AquaSmart prediction service for YOLOv8 classification (.pt).

    Expected backend model bundle:
    aquasmart-backend/
      models/
        aquasmart_best.pt
        class_names.json
        model_config.json
        thresholds.json
    """

    def __init__(self):
        self.base_dir = Path(__file__).resolve().parent.parent.parent
        self.model_dir = self.base_dir / "models"

        self.model_path = self.model_dir / "aquasmart_best.pt"
        self.class_names_path = self.model_dir / "class_names.json"
        self.model_config_path = self.model_dir / "model_config.json"
        self.thresholds_path = self.model_dir / "thresholds.json"

        self.model: Optional[YOLO] = None
        self.class_names: list[str] = []
        self.model_config: dict[str, Any] = {}
        self.thresholds: dict[str, Any] = {}
        self.model_load_error: Optional[str] = None

        self._load_assets()

    # =========================================================
    # Load helpers
    # =========================================================
    def _load_json(self, path: Path, default: dict | list):
        if not path.exists():
            return default

        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARN] failed to load json {path}: {e}")
            traceback.print_exc()
            return default

    def _load_assets(self):
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            self.model_config = self._load_json(self.model_config_path, {})
            self.thresholds = self._load_json(self.thresholds_path, {})
            loaded_class_names = self._load_json(self.class_names_path, [])

            print(f"[INFO] Loading prediction model from: {self.model_path}")
            self.model = YOLO(str(self.model_path))

            # Resolve class names
            if isinstance(loaded_class_names, list) and loaded_class_names:
                self.class_names = [str(x) for x in loaded_class_names]
            else:
                names = self.model.names
                if isinstance(names, dict):
                    self.class_names = [str(names[i]) for i in sorted(names.keys())]
                elif isinstance(names, list):
                    self.class_names = [str(x) for x in names]
                else:
                    self.class_names = []

            self.model_load_error = None

            print("[INFO] Prediction model loaded successfully")
            print(f"[INFO] Model path: {self.model_path}")
            print(f"[INFO] Image size: {self.get_image_size()}")
            print(f"[INFO] Classes: {self.class_names}")

        except Exception as e:
            self.model = None
            self.class_names = []
            self.model_load_error = str(e)

            print(f"[ERROR] Failed to load prediction model: {e}")
            traceback.print_exc()

    # =========================================================
    # Public health helpers
    # =========================================================
    def is_loaded(self) -> bool:
        return self.model is not None and self.model_load_error is None

    def get_image_size(self) -> tuple[int, int]:
        image_size = self.model_config.get("image_size", 320)

        if isinstance(image_size, list) and len(image_size) == 2:
            return int(image_size[0]), int(image_size[1])

        if isinstance(image_size, int):
            return image_size, image_size

        return 320, 320

    # =========================================================
    # Threshold helpers
    # Supports both old and new threshold key names
    # =========================================================
    def _threshold(
        self,
        *keys: str,
        default: float | bool | str,
    ):
        for key in keys:
            if key in self.thresholds:
                return self.thresholds[key]
        return default

    def _known_min_confidence(self) -> float:
        return float(
            self._threshold(
                "known_fish_min_confidence",
                "known_fish_confidence",
                default=0.70,
            )
        )

    def _unknown_max_confidence(self) -> float:
        return float(
            self._threshold(
                "unknown_fish_max_confidence",
                "unknown_fish_confidence",
                default=0.70,
            )
        )

    def _margin_threshold(self) -> float:
        return float(
            self._threshold(
                "top1_top2_min_margin",
                "margin_threshold",
                default=0.12,
            )
        )

    def _not_a_fish_enabled(self) -> bool:
        value = self._threshold("not_a_fish_enabled", default=False)
        return bool(value)

    def _not_a_fish_confidence(self) -> float:
        return float(
            self._threshold(
                "not_a_fish_confidence",
                default=0.90,
            )
        )

    # =========================================================
    # Inference helpers
    # =========================================================
    def _extract_probabilities(self, result) -> list[float]:
        probs = getattr(result, "probs", None)
        if probs is None:
            return []

        data = getattr(probs, "data", None)
        if data is None:
            return []

        try:
            if hasattr(data, "tolist"):
                values = data.tolist()
            else:
                values = list(data)

            return [float(x) for x in values]
        except Exception:
            return []

    def _get_class_name(self, index: int) -> str:
        if 0 <= index < len(self.class_names):
            return self.class_names[index]
        return f"class_{index}"

    def _build_all_probabilities(self, probabilities: list[float]) -> dict[str, float]:
        result = {}
        for i, prob in enumerate(probabilities):
            result[self._get_class_name(i)] = round(float(prob), 6)
        return result

    def _decide_prediction(
        self,
        raw_predicted_class: str,
        top1_confidence: float,
        top2_confidence: float,
    ) -> tuple[str, str]:
        """
        Return:
        - predicted_class
        - prediction_type

        Logic:
        - If model confidence is strong enough and top1/top2 gap is clear:
          return known_fish
        - Otherwise return unknown_fish
        - not_a_fish is disabled by default unless explicitly enabled
        """
        confidence_margin = top1_confidence - top2_confidence
        known_min = self._known_min_confidence()
        unknown_max = self._unknown_max_confidence()
        margin_min = self._margin_threshold()

        # Optional heuristic placeholder only
        if self._not_a_fish_enabled():
            not_a_fish_conf = self._not_a_fish_confidence()
            if top1_confidence >= not_a_fish_conf and raw_predicted_class.lower() in {
                "not_a_fish",
                "non_fish",
                "non-fish",
                "background",
            }:
                return "not_a_fish", "rejected_non_fish"

        if top1_confidence >= known_min and confidence_margin >= margin_min:
            return raw_predicted_class, "known_fish"

        if top1_confidence <= unknown_max:
            return "unknown_fish", "rejected_unknown_fish"

        return "unknown_fish", "rejected_unknown_fish"

    # =========================================================
    # Main prediction entry
    # =========================================================
    async def predict_upload(self, file: UploadFile) -> dict[str, Any]:
        if not self.is_loaded():
            raise HTTPException(
                status_code=500,
                detail=f"Prediction model is not loaded: {self.model_load_error}",
            )

        try:
            contents = await file.read()
            if not contents:
                raise HTTPException(status_code=400, detail="Empty image file")

            image = Image.open(BytesIO(contents)).convert("RGB")
            image_size = self.get_image_size()

            results = self.model.predict(
                source=image,
                imgsz=image_size[0],
                verbose=False,
            )

            if not results:
                raise HTTPException(status_code=500, detail="No prediction results returned")

            result = results[0]
            probabilities = self._extract_probabilities(result)

            if not probabilities:
                raise HTTPException(status_code=500, detail="Model did not return probabilities")

            top_indices = sorted(
                range(len(probabilities)),
                key=lambda i: probabilities[i],
                reverse=True,
            )

            top1_idx = top_indices[0]
            top2_idx = top_indices[1] if len(top_indices) > 1 else top_indices[0]

            top1_conf = float(probabilities[top1_idx])
            top2_conf = float(probabilities[top2_idx]) if len(probabilities) > 1 else 0.0

            raw_predicted_class = self._get_class_name(top1_idx)
            predicted_class, prediction_type = self._decide_prediction(
                raw_predicted_class=raw_predicted_class,
                top1_confidence=top1_conf,
                top2_confidence=top2_conf,
            )

            return {
                "status": "success",
                "predicted_class": predicted_class,
                "raw_predicted_class": raw_predicted_class,
                "confidence_percent": round(top1_conf * 100, 2),
                "prediction_type": prediction_type,
                "all_probabilities": self._build_all_probabilities(probabilities),
                "top1_confidence": round(top1_conf, 6),
                "top2_confidence": round(top2_conf, 6),
                "top1_top2_margin": round(top1_conf - top2_conf, 6),
                "image_size": list(image_size),
                "model_file": self.model_path.name,
            }

        except HTTPException:
            raise
        except Exception as e:
            print(f"[ERROR] prediction failed: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


prediction_service = PredictionService()