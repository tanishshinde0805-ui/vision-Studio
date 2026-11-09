from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class PixelBbox(BaseModel):
    x: float
    y: float
    w: float
    h: float

class GeoLocation(BaseModel):
    latitude: float
    longitude: float

class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: PixelBbox
    polygon: Optional[List[List[float]]] = None
    geo: Optional[GeoLocation] = None

class ImageSize(BaseModel):
    width: int
    height: int

class Timings(BaseModel):
    preprocess_ms: float
    inference_ms: float
    postprocess_ms: float
    total_ms: float

class GateResult(BaseModel):
    """Domain gate classification result."""
    decision: str = "underwater"  # "underwater" or "non_underwater"
    score: float = 1.0           # underwater probability [0, 1]
    threshold: float = 0.65
    latency_ms: float = 0.0
    model: str = "mobilenetv3-small"
    available: bool = True

class DetectionResult(BaseModel):
    id: Optional[str] = None
    filename: Optional[str] = None
    model: str
    demo: bool
    image_size: ImageSize
    detections: List[Detection]
    timings: Timings
    gate: Optional[GateResult] = None
    created_at: Optional[str] = None

class ModelRegistryItem(BaseModel):
    name: str
    framework: str
    available: bool
    weights_path: Optional[str] = None
    description: Optional[str] = None

class ErrorDetails(BaseModel):
    code: str
    message: str
    details: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetails
