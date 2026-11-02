import pytest
import io
import time
from PIL import Image
import numpy as np

from registry import registry
from detector import run_pipeline

def test_real_weights_resolved_and_available():
    """Verify that real finalist weights are resolved and available without DEMO_MODE."""
    # Ensure DEMO_MODE is not forcing fake
    assert not registry.is_demo_mode()
    
    trashcan_avail = registry.is_available("yolo11n-trashcan")
    assert trashcan_avail is True, "yolo11n-trashcan finalist weights must be available"
    
    deepplastic_avail = registry.is_available("yolo11n-deepplastic")
    assert deepplastic_avail is True, "yolo11n-deepplastic finalist weights must be available"

def test_real_inference_schema_and_non_demo_flag():
    """Verify that real inference runs with demo=False and returns valid schema."""
    img = Image.new("RGB", (320, 320), color=(14, 111, 124))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    result = run_pipeline(
        img_bytes,
        filename="test_real_benthic.jpg",
        model_name="yolo11n-trashcan",
        conf_thresh=0.25
    )

    assert result.demo is False, "Real model inference must return demo=False"
    assert result.model == "yolo11n-trashcan"
    assert result.image_size.width == 320
    assert result.image_size.height == 320
    assert result.timings.total_ms > 0
    assert isinstance(result.detections, list)

def test_real_inference_latency_budget():
    """Verify inference completes within latency budget (< 50ms for cached ONNX session)."""
    img = Image.new("RGB", (320, 320), color=(10, 36, 51))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    # Warmup
    _ = run_pipeline(img_bytes, model_name="yolo11n-trashcan", conf_thresh=0.25)

    # Benchmark 3 runs
    latencies = []
    for _ in range(3):
        t0 = time.time()
        res = run_pipeline(img_bytes, model_name="yolo11n-trashcan", conf_thresh=0.25)
        latencies.append((time.time() - t0) * 1000.0)

    avg_ms = sum(latencies) / len(latencies)
    assert avg_ms < 100.0, f"Average inference latency {avg_ms:.2f}ms exceeds 100ms CPU budget"
