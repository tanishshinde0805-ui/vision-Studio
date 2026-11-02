import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_list_models():
    response = client.get("/models")
    assert response.status_code == 200
    models = response.json()
    assert isinstance(models, list)
    model_names = [m["name"] for m in models]
    assert "fake" in model_names
    assert "yolo11n-seg" in model_names
    assert "yolov8n" in model_names

    # Fake model should always be available
    fake_model = next(m for m in models if m["name"] == "fake")
    assert fake_model["available"] is True
