import os
from dataclasses import dataclass
from typing import Optional

import numpy as np
import tensorflow as tf


SKIN_TYPE_LABELS = ["Combination", "Dry", "Normal", "Oily"]
SKIN_DISEASE_LABELS = ["BA- cellulitis", "BA-impetigo", "FU-athlete-foot", "FU-nail-fungus", "FU-ringworm","PA-cutaneous-larva-migrans","VI-chickenpox","VI-shingles"]
ROUTINE_LABELS = ["Gentle Hydrating", "Oil Control", "Brightening", "Soothing", "Balanced"]
DISEASE_THRESHOLD = 0.15
# Weighted fusion configuration (Skin type space: 4 classes)
WEIGHTS = {
    "skin_type": 0.45,
    "skin_disease": 0.35,
    "quiz_ann": 0.20,
}

DISEASE_TO_SKINTYPE_MATRIX = np.array(
    [
        # Combo  Dry   Normal  Oily
        [0.20, 0.30, 0.30, 0.20],  # Cellulitis
        [0.20, 0.30, 0.30, 0.20],  # Impetigo
        [0.15, 0.40, 0.25, 0.20],  # Athlete's Foot
        [0.15, 0.40, 0.25, 0.20],  # Nail Fungus
        [0.20, 0.30, 0.30, 0.20],  # Ringworm
        [0.25, 0.25, 0.25, 0.25],  # Cutaneous Larva Migrans
        [0.25, 0.25, 0.25, 0.25],  # Chickenpox
        [0.25, 0.25, 0.25, 0.25],  # Shingles
    ],
    dtype=np.float32,
)

ROUTINE_TO_SKINTYPE = {
    "Gentle Hydrating": "Dry",
    "Oil Control": "Oily",
    "Brightening": "Normal",
    "Soothing": "Dry",
    "Balanced": "Combination",
}


def _load_env_once() -> None:
    try:
        from dotenv import load_dotenv

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        load_dotenv(os.path.join(base_dir, ".env"))
    except Exception:
        # dotenv is optional at runtime; env vars can still be provided by the OS.
        return


_load_env_once()

# ── INSERT YOUR API KEY HERE ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")  # <-- INSERT YOUR API KEY HERE


@dataclass(frozen=True)
class LoadedModels:
    skin_type_model: tf.keras.Model
    skin_disease_model: tf.keras.Model
    skin_quiz_model: tf.keras.Model


_MODELS: Optional[LoadedModels] = None


def load_models_once(models_dir: Optional[str] = None) -> LoadedModels:
    global _MODELS
    if _MODELS is not None:
        return _MODELS

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    resolved_models_dir = models_dir or os.path.join(base_dir, "models")

    skin_type_path = os.path.join(resolved_models_dir, "skin_type_cnn.keras")
    skin_disease_path = os.path.join(resolved_models_dir, "skin_disease_cnn.keras")
    skin_quiz_path = os.path.join(resolved_models_dir, "skin_quiz_ann.keras")

    skin_type_model = tf.keras.models.load_model(skin_type_path)
    skin_disease_model = tf.keras.models.load_model(skin_disease_path)
    skin_quiz_model = tf.keras.models.load_model(skin_quiz_path)

    _MODELS = LoadedModels(
        skin_type_model=skin_type_model,
        skin_disease_model=skin_disease_model,
        skin_quiz_model=skin_quiz_model,
    )
    return _MODELS

def claude_personalized_suggestions(*, skin_type: str, conditions: list[str], routine: str) -> str:
    """
    Uses Gemini to generate friendly suggestion text.
    """
    api_key = (GEMINI_API_KEY or "").strip()
    if not api_key:
        return (
            "Keep it simple: cleanse gently, moisturize, and use SPF daily; "
            "add actives slowly and patch-test new products."
        )

    try:
        from google import genai as google_genai

        client = google_genai.Client(api_key=api_key)
        cond_text = ", ".join(conditions) if conditions else "no major visible concerns detected"
        prompt = (
            f"The user has {skin_type} skin with {cond_text}. "
            f"Their quiz suggests a {routine} routine. "
            "Give 4-5 specific, friendly, actionable skincare suggestions. "
            "Be warm, concise, and avoid medical claims."
        )

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt
        )
        return response.text.strip() or "Cleanse, moisturize, SPF — keep it consistent!"

    except Exception as e:
        print(f"GEMINI ERROR: {e}")
        return (
            "I couldn't generate personalized suggestions right now. "
            "In the meantime: cleanse gently, moisturize, and use SPF daily; "
            "add actives slowly and patch-test new products."
        )

def softmax_to_confidence_percent(probs: np.ndarray, idx: int) -> float:
    val = float(probs[idx])
    return round(val * 100.0, 1)


def _safe_normalize_probs(probs: np.ndarray) -> np.ndarray:
    probs = np.asarray(probs, dtype=np.float32).reshape(-1)
    s = float(probs.sum())
    if s <= 0:
        return np.ones_like(probs, dtype=np.float32) / float(len(probs))
    return probs / s


def _quiz_to_skin_type_probs(quiz_model_output: np.ndarray) -> np.ndarray:
    """
    Converts quiz model output to skin-type probability vector (shape: 4).
    - If model already outputs 4 probs, return normalized.
    - If model outputs 5 routine probs, map routines -> skin type via ROUTINE_TO_SKINTYPE.
    """
    out = np.asarray(quiz_model_output, dtype=np.float32).reshape(-1)
    out = _safe_normalize_probs(out)

    if out.shape[0] == 4:
        return out

    if out.shape[0] == 5:
        skin_probs = np.zeros((4,), dtype=np.float32)
        for routine_label, p in zip(ROUTINE_LABELS, out):
            skin_label = ROUTINE_TO_SKINTYPE.get(routine_label, "Normal")
            skin_idx = SKIN_TYPE_LABELS.index(skin_label)
            skin_probs[skin_idx] += float(p)
        return _safe_normalize_probs(skin_probs)

    # Unknown shape: fallback to uniform.
    return np.ones((4,), dtype=np.float32) / 4.0


def fuse_predictions(*, avg_type_probs: np.ndarray, avg_disease_probs: np.ndarray, quiz_probs_raw: np.ndarray) -> dict:
    """
    Weighted fusion of all 3 models in the 4-class skin-type space.
    Returns label/confidence plus all_probs + breakdown.
    """
    type_probs = _safe_normalize_probs(avg_type_probs)
    disease_probs = _safe_normalize_probs(avg_disease_probs)
    quiz_probs = _quiz_to_skin_type_probs(quiz_probs_raw)

    # Some saved disease models may output more classes than our 5-label mapping matrix.
    # We align by taking the first N disease probabilities that correspond to our labels.
    matrix_rows = int(DISEASE_TO_SKINTYPE_MATRIX.shape[0])
    if disease_probs.shape[0] != matrix_rows:
        if disease_probs.shape[0] > matrix_rows:
            disease_probs = disease_probs[:matrix_rows]
        else:
            padded = np.zeros((matrix_rows,), dtype=np.float32)
            padded[: disease_probs.shape[0]] = disease_probs
            disease_probs = padded
        disease_probs = _safe_normalize_probs(disease_probs)

    mapped_disease = disease_probs @ DISEASE_TO_SKINTYPE_MATRIX  # (4,)
    mapped_disease = _safe_normalize_probs(mapped_disease)

    final_probs = (
        WEIGHTS["skin_type"] * type_probs
        + WEIGHTS["skin_disease"] * mapped_disease
        + WEIGHTS["quiz_ann"] * quiz_probs
    )
    final_probs = _safe_normalize_probs(final_probs)

    skin_type_idx = int(np.argmax(final_probs))
    confidence = float(round(final_probs[skin_type_idx] * 100.0, 1))

    return {
        "label": SKIN_TYPE_LABELS[skin_type_idx],
        "confidence": confidence,
        "all_probs": {
            l: float(round(p * 100.0, 1)) for l, p in zip(SKIN_TYPE_LABELS, final_probs.tolist())
        },
        "breakdown": {
            "skin_type_cnn_weight": WEIGHTS["skin_type"],
            "skin_disease_cnn_weight": WEIGHTS["skin_disease"],
            "quiz_ann_weight": WEIGHTS["quiz_ann"],
        },
    }

