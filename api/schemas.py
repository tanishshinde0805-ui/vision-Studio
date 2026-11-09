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
    preprocess_ms: float = 0.0
    inference_ms: float = 0.0
    postprocess_ms: float = 0.0
    total_ms: float = 0.0

class GateResult(BaseModel):
    decision: str = "underwater"
    score: float = 1.0
    threshold: float = 0.65
    latency_ms: float = 0.0
    model: str = "mobilenetv3-small"
    available: bool = True

class DetectionResult(BaseModel):
    id: Optional[str] = None
    filename: Optional[str] = None
    model: str
    demo: bool = False
    image_size: ImageSize
    detections: List[Detection] = []
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

class StandardResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[ErrorDetails] = None
