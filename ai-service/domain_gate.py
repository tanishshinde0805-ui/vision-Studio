"""
Domain Gate: ONNX-based underwater/non-underwater binary classifier.
Rejects non-underwater images BEFORE the YOLO detector executes.
"""
import time
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image

# ONNX gate model path
_GATE_MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
_GATE_ONNX_PATH = _GATE_MODEL_DIR / "domain_gate_mobilenetv3.onnx"

# ImageNet normalisation constants (MobileNetV3 pretrained)
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 3, 1, 1)
_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 3, 1, 1)

# Label map
GATE_LABELS = {0: "non_underwater", 1: "underwater"}

# Default threshold — conservative to avoid false accepts
DEFAULT_GATE_THRESHOLD = 0.65

# Singleton session cache
_gate_session = None


def _get_gate_session():
    """Lazy-load ONNX Runtime session for the domain gate."""
    global _gate_session
    if _gate_session is not None:
        return _gate_session

    import onnxruntime as ort
    gate_path = str(_GATE_ONNX_PATH)

    # Allow override via environment variable
    import os
    env_path = os.environ.get("DOMAIN_GATE_WEIGHTS")
    if env_path and Path(env_path).exists():
        gate_path = env_path

    if not Path(gate_path).exists():
        return None

    _gate_session = ort.InferenceSession(
        gate_path,
        providers=["CPUExecutionProvider"]
    )
    return _gate_session


def is_gate_available() -> bool:
    """Check if domain gate ONNX model is available."""
    session = _get_gate_session()
    return session is not None


def preprocess_for_gate(img: Image.Image, size: int = 224) -> np.ndarray:
    """Resize, normalise, and convert PIL image to NCHW float32 tensor."""
    img_resized = img.convert("RGB").resize((size, size), Image.BILINEAR)
    arr = np.array(img_resized, dtype=np.float32) / 255.0  # HWC [0,1]
    arr = arr.transpose(2, 0, 1)  # CHW
    arr = arr[np.newaxis, ...]  # NCHW
    arr = (arr - _MEAN) / _STD  # Normalise
    return arr


def classify_domain(
    img: Image.Image,
    threshold: float = DEFAULT_GATE_THRESHOLD
) -> Tuple[str, float, float]:
    """
    Classify an image as underwater or non-underwater.

    Returns:
        (decision, underwater_score, latency_ms)
        decision: "underwater" or "non_underwater"
        underwater_score: softmax probability for the underwater class [0.0, 1.0]
        latency_ms: inference time in milliseconds
    """
    session = _get_gate_session()
    if session is None:
        # If gate model is unavailable, default to pass-through (allow all)
        return "underwater", 1.0, 0.0

    t0 = time.time()
    input_tensor = preprocess_for_gate(img)
    logits = session.run(None, {"input": input_tensor})[0]  # shape (1, 2)

    # Softmax
    exp_logits = np.exp(logits - np.max(logits, axis=1, keepdims=True))
    probs = exp_logits / np.sum(exp_logits, axis=1, keepdims=True)

    underwater_score = float(probs[0, 1])
    latency_ms = (time.time() - t0) * 1000.0

    decision = "underwater" if underwater_score >= threshold else "non_underwater"
    return decision, underwater_score, latency_ms


def gate_allows_detection(
    img: Image.Image,
    threshold: float = DEFAULT_GATE_THRESHOLD
) -> Tuple[bool, dict]:
    """
    Convenience function for the pipeline.
    Returns (should_detect, gate_metadata).
    """
    decision, score, latency = classify_domain(img, threshold)
    metadata = {
        "gate_decision": decision,
        "gate_score": round(score, 4),
        "gate_threshold": threshold,
        "gate_latency_ms": round(latency, 2),
        "gate_model": "mobilenetv3-small",
        "gate_available": is_gate_available(),
    }
    return decision == "underwater", metadata

