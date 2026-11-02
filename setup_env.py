import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / ".tmp"
VENV_DIR = TMP_DIR / "venv"
CACHE_DIR = TMP_DIR / "cache"

for sub in ["pip", "torch", "ultralytics", "huggingface", "npm", "playwright"]:
    (CACHE_DIR / sub).mkdir(parents=True, exist_ok=True)

# Set environment variables for isolation
os.environ["PIP_CACHE_DIR"] = str(CACHE_DIR / "pip")
os.environ["TORCH_HOME"] = str(CACHE_DIR / "torch")
os.environ["YOLO_CONFIG_DIR"] = str(CACHE_DIR / "ultralytics")
os.environ["HF_HOME"] = str(CACHE_DIR / "huggingface")

if not VENV_DIR.exists():
    print(f"Creating venv at {VENV_DIR}...", flush=True)
    subprocess.run([sys.executable, "-m", "venv", str(VENV_DIR)], check=True)
    print("Venv created.", flush=True)

py_exec = VENV_DIR / "Scripts" / "python.exe"
print(f"Venv Python: {py_exec}", flush=True)
