import os
import time
import math
import io
import uuid
from typing import Tuple, List, Optional
import numpy as np
from PIL import Image

from schemas import (
    Detection,
    PixelBbox,
    GeoLocation,
    ImageSize,
    Timings,
    DetectionResult,
    GateResult
)
from registry import registry, UNIFIED_CLASSES, DEFAULT_REGISTRY

class InferenceUnavailableError(Exception):
    """Raised when a requested model has no weights and DEMO_MODE is off."""
    pass

def is_solid_image(img_arr: np.ndarray) -> bool:
    """Detect if an image is solid homogeneous background (produces 0 detections)."""
    if img_arr.size == 0:
        return True
    std_val = float(np.std(img_arr))
    return std_val < 3.0

def run_fake_detector(
    img: Image.Image,
    model_name: str,
    conf_thresh: float = 0.25,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> Tuple[List[Detection], Timings]:
    """
    Deterministic fake detector for testing, verification, and demo mode.
    Returns 0 detections on solid images; otherwise returns realistic detections.
    """
    t0 = time.time()
    w, h = img.size
    img_arr = np.array(img)
    t_pre = (time.time() - t0) * 1000.0

    t1 = time.time()
    detections: List[Detection] = []

    # If image is solid homogeneous background, return 0 detections
    if not is_solid_image(img_arr):
        # Candidate detections from unified ontology
        candidate_items = [
            {
                "class_id": 40,
                "class_name": UNIFIED_CLASSES.get(40, "trash_plastic"),
                "confidence": 0.92,
                "bbox": PixelBbox(
                    x=round(w * 0.2, 1),
                    y=round(h * 0.25, 1),
                    w=round(w * 0.25, 1),
                    h=round(h * 0.25, 1)
                ),
                "polygon": [
                    [round(w * 0.2, 1), round(h * 0.25, 1)],
                    [round(w * 0.45, 1), round(h * 0.25, 1)],
                    [round(w * 0.45, 1), round(h * 0.5, 1)],
                    [round(w * 0.2, 1), round(h * 0.5, 1)],
                ],
                "lat_offset": 0.0008,
                "lon_offset": 0.0012,
            },
            {
                "class_id": 3,
                "class_name": UNIFIED_CLASSES.get(3, "shipwreck"),
                "confidence": 0.86,
                "bbox": PixelBbox(
                    x=round(w * 0.55, 1),
                    y=round(h * 0.45, 1),
                    w=round(w * 0.35, 1),
                    h=round(h * 0.3, 1)
                ),
                "polygon": [
                    [round(w * 0.55, 1), round(h * 0.45, 1)],
                    [round(w * 0.9, 1), round(h * 0.45, 1)],
                    [round(w * 0.9, 1), round(h * 0.75, 1)],
                    [round(w * 0.55, 1), round(h * 0.75, 1)],
                ],
                "lat_offset": -0.0015,
                "lon_offset": 0.0020,
            },
            {
                "class_id": 13,
                "class_name": UNIFIED_CLASSES.get(13, "mine_like_contact"),
                "confidence": 0.81,
                "bbox": PixelBbox(
                    x=round(w * 0.35, 1),
                    y=round(h * 0.65, 1),
                    w=round(w * 0.15, 1),
                    h=round(h * 0.15, 1)
                ),
                "polygon": None,
                "lat_offset": 0.0005,
                "lon_offset": -0.0009,
            }
        ]

        for item in candidate_items:
            conf = float(item["confidence"])
            if conf >= conf_thresh:
                geo_obj = None
                if latitude is not None and longitude is not None:
                    geo_obj = GeoLocation(
                        latitude=round(latitude + item["lat_offset"], 6),
                        longitude=round(longitude + item["lon_offset"], 6)
                    )
                detections.append(
                    Detection(
                        class_id=item["class_id"],
                        class_name=item["class_name"],
                        confidence=conf,
                        bbox=item["bbox"],
                        polygon=item["polygon"],
                        geo=geo_obj
                    )
                )

    t_infer = (time.time() - t1) * 1000.0

    t2 = time.time()
    t_post = (time.time() - t2) * 1000.0
    t_total = t_pre + t_infer + t_post

    timings = Timings(
        preprocess_ms=round(t_pre, 2),
        inference_ms=round(t_infer, 2),
        postprocess_ms=round(t_post, 2),
        total_ms=round(t_total, 2)
    )
    return detections, timings


def run_pipeline(
    image_bytes: bytes,
    filename: Optional[str] = "image.png",
    model_name: str = "fake",
    conf_thresh: float = 0.25,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> DetectionResult:
    """
    Main inference entrypoint.
    Executes real model on CPU if weights exist; otherwise executes FakeDetector
    if DEMO_MODE or model=='fake'. If weights are missing, raises InferenceUnavailableError.
    """
    if not image_bytes:
        raise ValueError("Image bytes are empty")

    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img.verify()
        pil_img = Image.open(io.BytesIO(image_bytes))
    except Exception as exc:
        raise ValueError(f"Corrupted or invalid image: {str(exc)}") from exc

    w, h = pil_img.size
    is_demo = registry.is_demo_mode() or (model_name == "fake")

    # Domain Gate Execution: Reject non-underwater images before YOLO detection
    gate_result_obj = None
    if model_name.startswith("pipeline-") or model_name == "domain-gate" or os.environ.get("ENABLE_DOMAIN_GATE", "0") in ("1", "true", "yes"):
        from domain_gate import classify_domain, is_gate_available
        gate_threshold = float(os.environ.get("DOMAIN_GATE_THRESHOLD", "0.65"))
        gate_decision, gate_score, gate_lat = classify_domain(pil_img, threshold=gate_threshold)
        gate_result_obj = GateResult(
            decision=gate_decision,
            score=round(gate_score, 4),
            threshold=gate_threshold,
            latency_ms=round(gate_lat, 2),
            model="mobilenetv3-small",
            available=is_gate_available()
        )
        # If non-underwater or standalone domain gate, return immediately with 0 detections
        if gate_decision == "non_underwater" or model_name == "domain-gate":
            timings = Timings(
                preprocess_ms=round(gate_lat * 0.3, 2),
                inference_ms=round(gate_lat * 0.7, 2),
                postprocess_ms=0.0,
                total_ms=round(gate_lat, 2)
            )
            return DetectionResult(
                id=f"DET-{uuid.uuid4().hex[:8].upper()}",
                filename=filename,
                model=model_name,
                demo=False,
                image_size=ImageSize(width=w, height=h),
                detections=[],  # Zero false positives on non-underwater images
                timings=timings,
                gate=gate_result_obj
            )

    # Check model registration
    model_info = registry.get_model_info(model_name)
    if not model_info:
        raise ValueError(f"Unknown model identifier: '{model_name}'")

    # Check weights availability
    weights_path = registry.resolve_weights_path(model_name)

    if not weights_path and not is_demo:
        raise InferenceUnavailableError(
            f"Model '{model_name}' weights not found at configured path. "
            f"Set {DEFAULT_REGISTRY.get(model_name, {}).get('env_var')} or enable DEMO_MODE=1."
        )

    # If demo mode is active or fake detector requested, run fake detector
    if is_demo or not weights_path:
        detections, timings = run_fake_detector(
            pil_img, model_name, conf_thresh, latitude, longitude
        )
        return DetectionResult(
            id=f"DET-{uuid.uuid4().hex[:8].upper()}",
            filename=filename,
            model=model_name,
            demo=True,
            image_size=ImageSize(width=w, height=h),
            detections=detections,
            timings=timings,
            gate=gate_result_obj
        )

    # Real model execution on CPU
    t0 = time.time()
    t_pre = 0.0
    detections: List[Detection] = []

    try:
        # Lazy import of ultralytics / torch for CPU inference
        from ultralytics import YOLO
        t_pre = (time.time() - t0) * 1000.0

        t1 = time.time()
        global _MODEL_CACHE
        if "_MODEL_CACHE" not in globals():
            _MODEL_CACHE = {}
        if weights_path not in _MODEL_CACHE:
            _MODEL_CACHE[weights_path] = YOLO(weights_path)
        model = _MODEL_CACHE[weights_path]
        results = model.predict(pil_img, device="cpu", conf=conf_thresh, verbose=False)
        t_infer = (time.time() - t1) * 1000.0

        t2 = time.time()
        mapping = registry.get_mapping(model_name)

        for res in results:
            boxes = getattr(res, "boxes", None)
            masks = getattr(res, "masks", None)
            if boxes is not None:
                for idx, box in enumerate(boxes):
                    cls_idx = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].tolist()
                    bx = float(xyxy[0])
                    by = float(xyxy[1])
                    bw = float(xyxy[2] - xyxy[0])
                    bh = float(xyxy[3] - xyxy[1])

                    poly = None
                    if masks is not None and idx < len(masks.xy):
                        poly_raw = masks.xy[idx]
                        if len(poly_raw) >= 3:
                            poly = [[round(float(pt[0]), 1), round(float(pt[1]), 1)] for pt in poly_raw]

                    global_cls_id = mapping.get(cls_idx, cls_idx)
                    global_cls_name = UNIFIED_CLASSES.get(global_cls_id, f"class_{global_cls_id}")

                    geo_obj = None
                    if latitude is not None and longitude is not None:
                        geo_obj = GeoLocation(latitude=latitude, longitude=longitude)

                    detections.append(
                        Detection(
                            class_id=global_cls_id,
                            class_name=global_cls_name,
                            confidence=round(conf, 4),
                            bbox=PixelBbox(x=round(bx, 1), y=round(by, 1), w=round(bw, 1), h=round(bh, 1)),
                            polygon=poly,
                            geo=geo_obj
                        )
                    )
        t_post = (time.time() - t2) * 1000.0
        timings = Timings(
            preprocess_ms=round(t_pre, 2),
            inference_ms=round(t_infer, 2),
            postprocess_ms=round(t_post, 2),
            total_ms=round(t_pre + t_infer + t_post, 2)
        )
        return DetectionResult(
            id=f"DET-{uuid.uuid4().hex[:8].upper()}",
            filename=filename,
            model=model_name,
            demo=False,
            image_size=ImageSize(width=w, height=h),
            detections=detections,
            timings=timings,
            gate=gate_result_obj
        )
    except Exception as exc:
        # If execution fails, fallback to error
        raise RuntimeError(f"Error executing model '{model_name}': {str(exc)}") from exc
