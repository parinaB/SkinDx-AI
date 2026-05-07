from __future__ import annotations

import json
import traceback
from datetime import datetime

import numpy as np
from flask import Blueprint, current_app, jsonify, request

from utils.image_utils import normalize_quiz_answers, preprocess_image
from utils.model_loader import (
    ROUTINE_LABELS,
    SKIN_DISEASE_LABELS,
    claude_personalized_suggestions,
    fuse_predictions,
    load_models_once,
)


predict_bp = Blueprint("predict", __name__)


@predict_bp.post("/api/predict")
def predict():
    try:
        models = load_models_once()

        images = request.files.getlist("images[]") or request.files.getlist("images")
        if not images or len(images) != 3:
            return jsonify({"error": "Please upload exactly 3 images (JPG/PNG)."}), 400

        quiz_raw = request.form.get("quiz_answers")
        if not quiz_raw:
            return jsonify({"error": "Missing quiz_answers."}), 400

        try:
            quiz_answers = json.loads(quiz_raw)
            if isinstance(quiz_answers, dict):
                # New frontend object payload (5 features)
                required = ["oil_level", "sleep_hours", "water_intake", "stress_level", "acne_frequency"]
                if any(k not in quiz_answers for k in required):
                    raise ValueError("quiz_answers missing required fields.")
                quiz_answers = {k: int(quiz_answers[k]) for k in required}
            elif isinstance(quiz_answers, list):
                # Legacy list payload
                quiz_answers = [int(x) for x in quiz_answers]
            else:
                raise ValueError("Invalid quiz_answers.")
        except Exception:
            return (
                jsonify(
                    {
                        "error": "quiz_answers must be a JSON object (oil_level, sleep_hours, water_intake, stress_level, acne_frequency) or a JSON array.",
                    }
                ),
                400,
            )

        # 1) Skin type CNN across 3 images -> average probs -> dominant
        skin_type_probs_list = []
        disease_probs_list = []
        for fs in images:
            x = preprocess_image(fs)
            skin_type_probs = models.skin_type_model.predict(x, verbose=0)[0]
            disease_probs = models.skin_disease_model.predict(x, verbose=0)[0]
            skin_type_probs_list.append(skin_type_probs)
            disease_probs_list.append(disease_probs)

        avg_skin_type_probs = np.mean(np.stack(skin_type_probs_list, axis=0), axis=0)

        # 2) Skin disease CNN across 3 images -> collect conditions above 30%
        avg_disease_probs = np.mean(np.stack(disease_probs_list, axis=0), axis=0)
        conditions = []
        for i, label in enumerate(SKIN_DISEASE_LABELS):
            conf_pct = float(avg_disease_probs[i]) * 100.0
            if conf_pct >= 30.0:
                conditions.append({"condition": label, "confidence": round(conf_pct, 1)})

        # Prefer not showing "Clear" alongside issues.
        if len(conditions) > 1:
            conditions = [c for c in conditions if c["condition"] != "Clear"] or conditions

        # 3) Quiz ANN -> routine label
        quiz_x = normalize_quiz_answers(quiz_answers)
        routine_probs = models.skin_quiz_model.predict(quiz_x, verbose=0)[0]
        routine_idx = int(np.argmax(routine_probs))
        routine_label = ROUTINE_LABELS[routine_idx]

        # Weighted fusion for final skin type (all 3 models)
        fused_skin_type = fuse_predictions(
            avg_type_probs=avg_skin_type_probs,
            avg_disease_probs=avg_disease_probs,
            quiz_probs_raw=routine_probs,
        )
        skin_type_label = fused_skin_type["label"]

        # 4) Claude personalized suggestions
        suggestion_text = claude_personalized_suggestions(
            skin_type=skin_type_label,
            conditions=[c["condition"] for c in conditions],
            routine=routine_label,
        )

        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        return jsonify(
            {
                "skin_type": fused_skin_type,
                "conditions": conditions,
                "routine": routine_label,
                "suggestions": suggestion_text,
                "timestamp": ts,
            }
        )
    except Exception as e:
        tb = traceback.format_exc()
        # Log full traceback for debugging in terminal.
        print("ERROR in /api/predict:", repr(e))
        print(tb)

        payload = {"error": "Something went wrong while analyzing your images. Please try again."}
        if bool(getattr(current_app, "debug", False)):
            payload["debug_error"] = repr(e)
            payload["debug_trace"] = tb.splitlines()[-12:]

        return jsonify(payload), 500

