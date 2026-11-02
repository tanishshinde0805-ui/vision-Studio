import os
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
from schemas import ModelRegistryItem

# Root path for classes.json
ROOT_DIR = Path(__file__).resolve().parent.parent
CLASSES_JSON_PATH = Path(os.environ.get("CLASSES_JSON_PATH", ROOT_DIR / "classes.json"))

def load_unified_classes() -> Dict[int, str]:
    """Loads unified class dictionary {id: name} from classes.json."""
    if not CLASSES_JSON_PATH.exists():
        # Fallback if running inside ai-service container where classes.json is mounted
        alt_path = Path(__file__).resolve().parent / "classes.json"
        if alt_path.exists():
            target = alt_path
        else:
            return {
                0: "trash", 1: "bio", 2: "rov", 3: "shipwreck", 4: "submarine_pipeline",
                5: "cylinder", 6: "ghost_net", 7: "crab_pot", 8: "unidentified_object",
                9: "marine_life_cluster", 10: "debris_field", 11: "geological_formation",
                12: "pipeline_damage", 13: "mine_like_contact", 40: "trash_plastic"
            }
    else:
        target = CLASSES_JSON_PATH

    with open(target, "r", encoding="utf-8") as f:
        data = json.load(f)
        return {item["id"]: item["name"] for item in data.get("classes", [])}

UNIFIED_CLASSES = load_unified_classes()

# Registry Definition
# Each model specifies its name, framework, optional weights path, and native-to-global mapping
DEFAULT_REGISTRY: Dict[str, Dict[str, Any]] = {
    "yolo11n-trashcan": {
        "name": "yolo11n-trashcan",
        "framework": "ultralytics",
        "description": "YOLO11n trained on 22 TrashCan classes (ROV, fauna, benthic debris)",
        "env_var": "MODEL_YOLO11N_TRASHCAN_WEIGHTS",
        "default_weights": "models/finalist_trashcan_yolo11n.pt",
        "native_to_global": {
            0: 2, 1: 14, 2: 15, 3: 16, 4: 17, 5: 18, 6: 19, 7: 20,
            8: 21, 9: 22, 10: 23, 11: 24, 12: 25, 13: 26, 14: 27,
            15: 28, 16: 29, 17: 30, 18: 31, 19: 32, 20: 33, 21: 34
        }
    },
    "yolo11n-deepplastic": {
        "name": "yolo11n-deepplastic",
        "framework": "ultralytics",
        "description": "YOLO11n trained on oceanic plastic debris (DeepPlastic v1)",
        "env_var": "MODEL_YOLO11N_DEEPPLASTIC_WEIGHTS",
        "default_weights": "models/finalist_deepplastic_yolo11n.pt",
        "native_to_global": {0: 40}
    },
    "fake": {
        "name": "fake",
        "framework": "synthetic",
        "description": "Deterministic fake detector for test suites and UI development",
        "env_var": None,
        "default_weights": None,
        "native_to_global": {i: i for i in UNIFIED_CLASSES.keys()}
    },
    "yolo11n-seg": {
        "name": "yolo11n-seg",
        "framework": "ultralytics",
        "description": "Ultralytics YOLO11n-Seg underwater anomaly detection",
        "env_var": "MODEL_YOLO11N_SEG_WEIGHTS",
        "default_weights": "weights/yolo11n-seg.pt",
        "native_to_global": {
            0: 3,   # shipwreck
            1: 4,   # submarine_pipeline
            2: 5,   # cylinder
            3: 6,   # ghost_net
            4: 7,   # crab_pot
            5: 8,   # unidentified_object
            6: 9,   # marine_life_cluster
            7: 10,  # debris_field
            8: 11,  # geological_formation
            9: 12,  # pipeline_damage
            10: 13  # mine_like_contact
        }
    },
    "yolov8n": {
        "name": "yolov8n",
        "framework": "ultralytics",
        "description": "YOLOv8 Nano underwater debris detector",
        "env_var": "MODEL_YOLOV8N_WEIGHTS",
        "default_weights": "weights/yolov8n.pt",
        "native_to_global": {0: 0, 1: 1, 2: 2, 3: 40}
    },
    "yolov8x": {
        "name": "yolov8x",
        "framework": "ultralytics",
        "description": "YOLOv8 Extra-Large high-accuracy sonar detector",
        "env_var": "MODEL_YOLOV8X_WEIGHTS",
        "default_weights": "weights/yolov8x.pt",
        "native_to_global": {0: 0, 1: 1, 2: 2, 3: 40}
    },
    "yolov5s": {
        "name": "yolov5s",
        "framework": "ultralytics",
        "description": "YOLOv5 Small lightweight detector",
        "env_var": "MODEL_YOLOV5S_WEIGHTS",
        "default_weights": "weights/yolov5s.pt",
        "native_to_global": {0: 0, 1: 1, 2: 2, 3: 40}
    },
    "yolov6s": {
        "name": "yolov6s",
        "framework": "ultralytics",
        "description": "YOLOv6 Small industrial sonar detector",
        "env_var": "MODEL_YOLOV6S_WEIGHTS",
        "default_weights": "weights/yolov6s.pt",
        "native_to_global": {0: 0, 1: 1, 2: 2, 3: 40}
    },
    "faster-rcnn": {
        "name": "faster-rcnn",
        "framework": "torchvision",
        "description": "Two-stage Faster R-CNN (ResNet50-FPN) benchmark",
        "env_var": "MODEL_FASTER_RCNN_WEIGHTS",
        "default_weights": "weights/faster_rcnn.pth",
        "native_to_global": {0: 0, 1: 1, 2: 2}
    },
    "marineguard-yolo": {
        "name": "marineguard-yolo",
        "framework": "ultralytics",
        "description": "MarineGuard side-scan debris model",
        "env_var": "MODEL_MARINEGUARD_WEIGHTS",
        "default_weights": "weights/marineguard_best.pt",
        "native_to_global": {0: 3, 1: 4, 2: 6, 3: 40}
    }
}

class ModelRegistry:
    def __init__(self):
        self.demo_mode = os.environ.get("DEMO_MODE", "0").lower() in ("1", "true", "yes")

    def is_demo_mode(self) -> bool:
        return self.demo_mode or os.environ.get("DEMO_MODE", "0").lower() in ("1", "true", "yes")

    def resolve_weights_path(self, model_key: str) -> Optional[str]:
        cfg = DEFAULT_REGISTRY.get(model_key)
        if not cfg:
            return None
        env_var = cfg.get("env_var")
        if env_var and os.environ.get(env_var):
            path = os.environ.get(env_var)
            if os.path.exists(path):
                return path

        default_rel = cfg.get("default_weights")
        if default_rel:
            for base in [ROOT_DIR, ROOT_DIR / "ai-service"]:
                candidate = base / default_rel
                if candidate.exists():
                    return str(candidate)
                candidate_onnx = candidate.with_suffix(".onnx")
                if candidate_onnx.exists():
                    return str(candidate_onnx)

            # Also check vision bench/Backend/best.pt if applicable
            bench_weights = ROOT_DIR.parent / "vision bench" / "Backend" / "best.pt"
            if model_key == "yolo11n-seg" and bench_weights.exists():
                return str(bench_weights)

        return None

    def is_available(self, model_key: str) -> bool:
        if model_key == "fake":
            return True
        if self.is_demo_mode():
            # In demo mode, all registered models are available via fake detector with demo: true
            return model_key in DEFAULT_REGISTRY
        weights_path = self.resolve_weights_path(model_key)
        return weights_path is not None and os.path.isfile(weights_path)

    def get_model_info(self, model_key: str) -> Optional[ModelRegistryItem]:
        cfg = DEFAULT_REGISTRY.get(model_key)
        if not cfg:
            return None
        weights_path = self.resolve_weights_path(model_key)
        available = self.is_available(model_key)
        return ModelRegistryItem(
            name=cfg["name"],
            framework=cfg["framework"],
            available=available,
            weights_path=weights_path if available else None,
            description=cfg["description"]
        )

    def list_models(self) -> List[ModelRegistryItem]:
        return [self.get_model_info(key) for key in DEFAULT_REGISTRY.keys()]

    def get_mapping(self, model_key: str) -> Dict[int, int]:
        cfg = DEFAULT_REGISTRY.get(model_key, {})
        return cfg.get("native_to_global", {0: 0})

registry = ModelRegistry()
