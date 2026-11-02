import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_synthetic_png(width=200, height=200, solid=False):
    if solid:
        arr = np.full((height, width, 3), 128, dtype=np.uint8)
    else:
        arr = np.random.randint(50, 200, (height, width, 3), dtype=np.uint8)
        # Draw some variation
        arr[50:100, 50:100] = 255
    pil_img = Image.fromarray(arr)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()

def test_infer_fake_model():
    img_bytes = create_synthetic_png(300, 300, solid=False)
    files = {"file": ("test.png", img_bytes, "image/png")}
    data = {
        "model": "fake",
        "confidence_threshold": 0.25,
        "latitude": 12.3456,
        "longitude": 78.9012
    }
    response = client.post("/infer", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert res["model"] == "fake"
    assert res["demo"] is True
    assert res["image_size"]["width"] == 300
    assert res["image_size"]["height"] == 300
    assert len(res["detections"]) > 0

    det = res["detections"][0]
    assert "class_id" in det
    assert "class_name" in det
    assert 0.0 <= det["confidence"] <= 1.0
    assert "bbox" in det
    assert det["bbox"]["w"] > 0
    if det.get("geo"):
        assert abs(det["geo"]["latitude"] - 12.3456) < 0.1

def test_infer_solid_image():
    img_bytes = create_synthetic_png(200, 200, solid=True)
    files = {"file": ("solid.png", img_bytes, "image/png")}
    data = {"model": "fake", "confidence_threshold": 0.25}
    response = client.post("/infer", files=files, data=data)
    assert response.status_code == 200
    res = response.json()
    assert len(res["detections"]) == 0

def test_infer_unavailable_model_returns_503(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "0")
    img_bytes = create_synthetic_png(200, 200)
    files = {"file": ("test.png", img_bytes, "image/png")}
    # yolov8x has no weights configured by default
    data = {"model": "yolov8x", "confidence_threshold": 0.25}
    response = client.post("/infer", files=files, data=data)
    # If weights not present, must return 503
    if response.status_code != 200:
        assert response.status_code == 503
        data = response.json()
        assert data["error"]["code"] == "MODEL_UNAVAILABLE"
        assert "weights not found" in data["error"]["message"].lower()

def test_legacy_internal_inference():
    payload = {
        "jobId": "JOB-101",
        "missionId": "MSN-101",
        "inputReference": "ref_data",
        "modelVersion": "v1.0.0"
    }
    response = client.post("/internal/inference", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert res["jobId"] == "JOB-101"
    assert len(res["anomalies"]) > 0
