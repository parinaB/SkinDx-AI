from __future__ import annotations

import numpy as np
from PIL import Image


def preprocess_image(file_storage, *, size: tuple[int, int] = (224, 224)) -> np.ndarray:
    """
    Accepts a Werkzeug FileStorage, returns (1,224,224,3) float32 in [0,1].
    """
    img = Image.open(file_storage.stream).convert("RGB")
    img = img.resize(size)
    arr = np.asarray(img).astype("float32") / 255.0
    arr = np.expand_dims(arr, axis=0)
    return arr


def normalize_quiz_answers(answers: list[int] | dict) -> np.ndarray:
    """
    Supports:
    - New frontend payload: dict with keys:
        oil_level (0-3), sleep_hours (4/5/8/9), water_intake (1/2/3/5),
        stress_level (0-3), acne_frequency (0-3)
      -> returns (1,5) float32 WITHOUT extra normalization (matches training integers).
    - Legacy payload: list of numbers -> returns (1,N) float32.
    """
    if isinstance(answers, dict):
        keys = ["oil_level", "sleep_hours", "water_intake", "stress_level", "acne_frequency"]
        vec = [float(answers.get(k, 0)) for k in keys]
        return np.asarray(vec, dtype="float32").reshape(1, 5)

    arr = np.asarray(answers, dtype="float32").reshape(1, -1)
    return arr

