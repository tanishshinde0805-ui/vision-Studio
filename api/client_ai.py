import os
import io
import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from config import AI_SERVICE_URL, AI_TIMEOUT_SECONDS
from schemas import DetectionResult, ModelRegistryItem

class AIServiceException(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, details: Optional[str] = None):
        super().__init__(
            status_code=status_code,
            detail={"code": code, "message": message, "details": details}
        )

async def call_ai_infer(
    file_bytes: bytes,
    filename: str,
    model: str = "fake",
    confidence_threshold: float = 0.25,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> Dict[str, Any]:
    """
    Forwards inference request to AI microservice with timeout and error handling.
    """
    url = f"{AI_SERVICE_URL.rstrip('/')}/infer"
    files = {"file": (filename, io.BytesIO(file_bytes), "image/png")}
    data = {
        "model": model,
        "confidence_threshold": str(confidence_threshold)
    }
    if latitude is not None:
        data["latitude"] = str(latitude)
    if longitude is not None:
        data["longitude"] = str(longitude)

    try:
        async with httpx.AsyncClient(timeout=AI_TIMEOUT_SECONDS) as client:
            resp = await client.post(url, files=files, data=data)

            if resp.status_code == 200:
                return resp.json()

            # Handle 503 Model Unavailable
            if resp.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
                try:
                    err_json = resp.json().get("error", {})
                    raise AIServiceException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        code=err_json.get("code", "MODEL_UNAVAILABLE"),
                        message=err_json.get("message", f"Model '{model}' is currently unavailable (missing weights)."),
                        details=err_json.get("details", "Set model weights in env or enable DEMO_MODE.")
                    )
                except (ValueError, KeyError):
                    raise AIServiceException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        code="MODEL_UNAVAILABLE",
                        message=f"AI service returned 503 for model '{model}'."
                    )

            # Other errors
            raise AIServiceException(
                status_code=resp.status_code,
                code="AI_SERVICE_ERROR",
                message=f"AI Service error (status {resp.status_code})",
                details=resp.text
            )

    except httpx.TimeoutException:
        raise AIServiceException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            code="AI_SERVICE_TIMEOUT",
            message=f"Inference timed out after {AI_TIMEOUT_SECONDS}s at AI Service."
        )
    except httpx.ConnectError:
        if model == "fake" or os.environ.get("DEMO_MODE", "0") in ("1", "true", "yes"):
            try:
                import sys
                from pathlib import Path
                ai_dir = Path(__file__).resolve().parent.parent / "ai-service"
                if str(ai_dir) not in sys.path:
                    sys.path.insert(0, str(ai_dir))
                from detector import run_pipeline
                res = run_pipeline(
                    image_bytes=file_bytes,
                    filename=filename,
                    model_name=model,
                    conf_thresh=confidence_threshold,
                    latitude=latitude,
                    longitude=longitude
                )
                return res.model_dump()
            except Exception:
                pass

        raise AIServiceException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            code="AI_SERVICE_UNREACHABLE",
            message=f"Could not connect to AI Service at {AI_SERVICE_URL}."
        )

async def fetch_models() -> List[Dict[str, Any]]:
    """
    Fetches model registry from AI service.
    """
    url = f"{AI_SERVICE_URL.rstrip('/')}/models"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass

    # Fallback registry if AI service is not yet ready
    return [
        {
            "name": "pipeline-trashcan",
            "framework": "cascade",
            "available": True,
            "weights_path": "models/finalist_trashcan_yolo11n.onnx",
            "description": "Multi-Model Cascade: MobileNetV3 Domain Gate + YOLO11n TrashCan (22 classes)"
        },
        {
            "name": "pipeline-deepplastic",
            "framework": "cascade",
            "available": True,
            "weights_path": "models/finalist_deepplastic_yolo11n.onnx",
            "description": "Multi-Model Cascade: MobileNetV3 Domain Gate + YOLO11n DeepPlastic"
        },
        {
            "name": "yolo11n-trashcan",
            "framework": "ultralytics",
            "available": True,
            "weights_path": "models/finalist_trashcan_yolo11n.onnx",
            "description": "YOLO11n trained on 22 TrashCan classes"
        },
        {
            "name": "yolo11n-deepplastic",
            "framework": "ultralytics",
            "available": True,
            "weights_path": "models/finalist_deepplastic_yolo11n.onnx",
            "description": "YOLO11n trained on oceanic plastic debris"
        },
        {
            "name": "fake",
            "framework": "synthetic",
            "available": True,
            "weights_path": None,
            "description": "Deterministic fake detector for test suites and UI development"
        }
    ]
