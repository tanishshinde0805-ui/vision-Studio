import io
import pytest
import numpy as np
from PIL import Image
from pathlib import Path

import sys
AI_SERVICE_DIR = Path(__file__).resolve().parent.parent
if str(AI_SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(AI_SERVICE_DIR))

from domain_gate import classify_domain, is_gate_available, DEFAULT_GATE_THRESHOLD
from detector import run_pipeline
from schemas import DetectionResult


def test_domain_gate_model_availability():
    """Verify that domain gate ONNX model is available and initialized."""
    assert is_gate_available() is True, "Domain gate ONNX model must be available"


def test_terrestrial_image_zero_false_positives():
    """Verify that non-underwater images are strictly rejected with 0 detections."""
    # Red-dominated terrestrial image
    red_arr = np.full((224, 224, 3), [220, 45, 30], dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(red_arr).save(buf, format="PNG")
    img_bytes = buf.getvalue()

    result: DetectionResult = run_pipeline(
        image_bytes=img_bytes,
        filename="terrestrial_test.png",
        model_name="pipeline-trashcan"
    )

    assert result.gate is not None
    assert result.gate.decision == "non_underwater"
    assert result.gate.score < DEFAULT_GATE_THRESHOLD
    # ARCHITECTURAL ZERO FALSE POSITIVES GUARANTEE:
    assert len(result.detections) == 0
    assert result.timings.total_ms > 0


def test_underwater_image_acceptance():
    """Verify that genuine underwater frames are accepted through the gate."""
    val_dir = AI_SERVICE_DIR.parent / "datasets" / "trashcan_instance" / "images" / "val"
    if not val_dir.exists():
        pytest.skip("TrashCan validation dataset images not present")

    images = list(val_dir.glob("*.jpg"))
    if not images:
        pytest.skip("No JPG files found in validation set")

    target_image = images[0]
    with open(target_image, "rb") as f:
        img_bytes = f.read()

    result: DetectionResult = run_pipeline(
        image_bytes=img_bytes,
        filename=target_image.name,
        model_name="pipeline-trashcan"
    )

    assert result.gate is not None
    assert result.gate.decision == "underwater"
    assert result.gate.score >= DEFAULT_GATE_THRESHOLD


def test_pipeline_deepplastic_cascade():
    """Verify pipeline-deepplastic cascade behaves correctly."""
    # Urban grey concrete image
    grey_arr = np.full((224, 224, 3), [128, 128, 128], dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(grey_arr).save(buf, format="PNG")

    result: DetectionResult = run_pipeline(
        image_bytes=buf.getvalue(),
        filename="urban_concrete.png",
        model_name="pipeline-deepplastic"
    )

    assert result.gate is not None
    assert result.gate.decision == "non_underwater"
    assert len(result.detections) == 0


def test_standalone_domain_gate():
    """Verify standalone domain gate model returns classification without detector."""
    arr = np.full((224, 224, 3), [140, 100, 60], dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")

    result: DetectionResult = run_pipeline(
        image_bytes=buf.getvalue(),
        filename="wood.png",
        model_name="domain-gate"
    )

    assert result.gate is not None
    assert result.gate.decision == "non_underwater"
    assert len(result.detections) == 0

