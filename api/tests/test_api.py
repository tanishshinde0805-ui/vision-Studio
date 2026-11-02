import os
import io
import pytest
import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

def create_synthetic_png(width=400, height=300, solid=False):
    if solid:
        arr = np.full((height, width, 3), 128, dtype=np.uint8)
    else:
        arr = np.random.randint(50, 200, (height, width, 3), dtype=np.uint8)
        arr[50:120, 50:120] = 250
    pil_img = Image.fromarray(arr)
    buf = io.BytesIO()
    pil_img.save(buf, format="PNG")
    return buf.getvalue()

VALID_PNG = create_synthetic_png(400, 300, solid=False)
SOLID_PNG = create_synthetic_png(300, 300, solid=True)

def test_01_health_check():
    """Scenario 12: Health check endpoint verification"""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert json_data["data"]["status"] == "online"
    assert "MARIANATECH" in json_data["data"]["system"]

def test_02_mission_stats():
    """Scenario 12: Mission statistics endpoint verification"""
    response = client.get("/api/v1/missions/stats")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True
    assert "total_missions" in json_data["data"]
    assert "pending_review" in json_data["data"]

def test_03_valid_image_inference():
    """Rewritten test 03: Valid image inference conforms to openapi.yaml schema"""
    files = {"file": ("test_sonar.png", VALID_PNG, "image/png")}
    data = {"latitude": -6.3, "longitude": 71.2, "model": "fake"}
    response = client.post("/api/v1/detect", files=files, data=data)

    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    pipeline_data = res["data"]
    assert pipeline_data["status"] == "success"
    assert "detections" in pipeline_data
    assert len(pipeline_data["detections"]) > 0

    det = pipeline_data["detections"][0]
    assert "class_id" in det
    assert "class_name" in det
    assert "confidence" in det
    assert "bbox" in det
    assert "timings" in pipeline_data
    assert "image_size" in pipeline_data

def test_04_invalid_file_type():
    """Scenario 2: Plain text file upload rejected"""
    files = {"file": ("document.txt", b"This is a text file", "text/plain")}
    response = client.post("/api/v1/detect", files=files)

    assert response.status_code == 415
    res = response.json()
    assert res["success"] is False
    assert res["error"]["code"] == "HTTP_ERROR"
    assert "Unsupported file extension" in res["error"]["message"]

def test_05_unsupported_file_extension():
    """Scenario 3: PDF file upload rejected"""
    files = {"file": ("report.pdf", b"%PDF-1.5 fake pdf content", "application/pdf")}
    response = client.post("/api/v1/detect", files=files)

    assert response.status_code == 415
    res = response.json()
    assert res["success"] is False
    assert ".pdf" in res["error"]["message"]

def test_06_corrupted_image():
    """Scenario 4: Corrupted PNG bytes"""
    files = {"file": ("corrupted.png", b"\x89PNG\x0d\x0a\x1a\x0aCORRUPTED_BYTES_HERE", "image/png")}
    response = client.post("/api/v1/detect", files=files)

    assert response.status_code == 422
    res = response.json()
    assert res["success"] is False
    assert "Corrupted or invalid image" in res["error"]["message"]

def test_07_zero_detections_solid_image():
    """Rewritten test 07: Solid homogeneous background produces 0 detections"""
    files = {"file": ("solid.png", SOLID_PNG, "image/png")}
    response = client.post("/api/v1/detect", files=files)

    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert len(res["data"]["detections"]) == 0

def test_08_confidence_values_bounds():
    """Rewritten test 08: Confidence score strictly bounded between 0.0 and 1.0"""
    files = {"file": ("test_sonar.png", VALID_PNG, "image/png")}
    response = client.post("/api/v1/detect", files=files)
    assert response.status_code == 200
    res = response.json()

    detections = res["data"]["detections"]
    for d in detections:
        conf = d["confidence"]
        assert 0.0 <= conf <= 1.0

def test_09_metadata_extraction():
    """Scenario 8: Image metadata correctly extracted"""
    files = {"file": ("test_sonar.png", VALID_PNG, "image/png")}
    response = client.post("/api/v1/detect", files=files)
    assert response.status_code == 200
    res = response.json()

    metadata = res["data"]["metadata"]
    assert metadata["format"] in ["PNG", "JPEG", "UNKNOWN"]
    assert metadata["width"] > 0
    assert metadata["height"] > 0

def test_10_geospatial_coordinates():
    """Rewritten test 10: Coordinates Lat/Lon correctly associated with base coordinates"""
    files = {"file": ("test_sonar.png", VALID_PNG, "image/png")}
    data = {"latitude": -12.3456, "longitude": 88.7654}
    response = client.post("/api/v1/detect", files=files, data=data)
    assert response.status_code == 200
    res = response.json()

    detections = res["data"]["detections"]
    for d in detections:
        if d.get("geo"):
            assert abs(d["geo"]["latitude"] - (-12.3456)) < 0.5
            assert abs(d["geo"]["longitude"] - 88.7654) < 0.5

def test_11_json_report_download():
    """Scenario 10: JSON report download format"""
    response = client.get("/api/v1/missions/MSN-2026-0142/reports/download?format=json")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["mission_id"] == "MSN-2026-0142"
    assert len(res["data"]["anomalies"]) > 0

def test_12_csv_report_download():
    """Scenario 11: CSV report download format"""
    response = client.get("/api/v1/missions/MSN-2026-0142/reports/download?format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    csv_text = response.text
    assert "Anomaly ID,Mission ID,Class Name" in csv_text
    assert "ANM-0142-001" in csv_text

def test_13_analysis_history_list():
    """Phase 14: Analysis history listing & status filter"""
    response = client.get("/api/v1/analyses?status=completed")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    items = res["data"]["items"]
    assert len(items) > 0
    for item in items:
        assert item["status"] == "completed"

def test_14_analysis_stats():
    """Phase 14: Analysis statistics endpoint"""
    response = client.get("/api/v1/analyses/stats")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    data = res["data"]
    assert "total_analyses" in data
    assert "completed" in data
    assert "failed" in data

def test_15_analysis_by_id():
    """Phase 14: Single analysis lookup by ID"""
    response = client.get("/api/v1/analyses/ANL-2026-0142")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["id"] == "ANL-2026-0142"

def test_16_analysis_deletion():
    """Phase 14: Analysis deletion endpoint"""
    from db import get_db, AnalysisRecord
    db = next(get_db())
    rec = db.query(AnalysisRecord).filter(AnalysisRecord.id == "ANL-2026-0139").first()
    if rec and rec.status == "deleted":
        rec.status = "failed"
        db.commit()
    db.close()

    response = client.delete("/api/v1/analyses/ANL-2026-0139")
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert res["data"]["status"] == "deleted"

    # Verify it can no longer be found
    get_res = client.get("/api/v1/analyses/ANL-2026-0139")
    assert get_res.status_code == 404

def test_17_detect_auto_persistence():
    """Phase 14: Inference automatically creates persistent analysis record"""
    files = {"file": ("test_sonar.png", VALID_PNG, "image/png")}
    response = client.post("/api/v1/detect", files=files)
    assert response.status_code == 200
    res = response.json()
    assert res["success"] is True
    assert "analysis_id" in res["data"]

    analysis_id = res["data"]["analysis_id"]
    history_res = client.get(f"/api/v1/analyses/{analysis_id}")
    assert history_res.status_code == 200
    assert history_res.json()["data"]["id"] == analysis_id

def test_18_zero_byte_upload():
    """Phase 17: Zero-byte image upload rejected with 400 Bad Request"""
    files = {"file": ("empty.png", b"", "image/png")}
    response = client.post("/api/v1/detect", files=files)
    assert response.status_code == 400
    res = response.json()
    assert res["success"] is False
    assert "empty" in res["error"]["message"].lower()

def test_19_oversized_file_upload():
    """Phase 17: Oversized image upload (>50MB) rejected with 413 Payload Too Large"""
    large_bytes = b"x" * (51 * 1024 * 1024)
    files = {"file": ("large.png", large_bytes, "image/png")}
    response = client.post("/api/v1/detect", files=files)
    assert response.status_code == 413
    res = response.json()
    assert res["success"] is False
    assert "exceeds" in res["error"]["message"].lower()

def test_20_out_of_bounds_coordinates():
    """Phase 17: Out-of-bounds latitude/longitude rejected with 400 Bad Request"""
    files = {"file": ("test_sonar.png", VALID_PNG, "image/png")}
    data = {"latitude": 150.0, "longitude": 71.2}
    response = client.post("/api/v1/detect", files=files, data=data)
    assert response.status_code == 400
    res = response.json()
    assert res["success"] is False
    assert "latitude" in res["error"]["message"].lower()
