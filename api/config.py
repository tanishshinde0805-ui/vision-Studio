import os
from pathlib import Path

# Paths
API_DIR = Path(__file__).resolve().parent
ROOT_DIR = API_DIR.parent
CLASSES_JSON_PATH = Path(os.environ.get("CLASSES_JSON_PATH", ROOT_DIR / "classes.json"))
UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", API_DIR / "data" / "uploads"))

# Server Config
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "5000"))
DEBUG = os.environ.get("DEBUG", "0").lower() in ("1", "true", "yes")

# AI Service Config
AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://127.0.0.1:8000")
AI_TIMEOUT_SECONDS = float(os.environ.get("AI_TIMEOUT_SECONDS", "30.0"))

# Database Config
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{API_DIR / 'vision_studio.db'}")

# Upload Config
MAX_UPLOAD_SIZE = int(os.environ.get("MAX_UPLOAD_SIZE", 50 * 1024 * 1024))  # 50 MB
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tiff", ".bmp"}

# CORS Config
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# Demo Mode
DEMO_MODE = os.environ.get("DEMO_MODE", "0").lower() in ("1", "true", "yes")

# Web dist path (for serving SPA)
WEB_DIST = ROOT_DIR / "web" / "dist"
