import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_root():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "vision-stack-ai-service"
    assert "total_models" in data
    assert "available_models" in data

def test_health_v1():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
