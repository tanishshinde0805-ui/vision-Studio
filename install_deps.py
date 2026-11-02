import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
VENV_PY = BASE_DIR / ".tmp" / "venv" / "Scripts" / "python.exe"
CACHE_DIR = BASE_DIR / ".tmp" / "cache" / "pip"

def log(msg: str):
    print(f"[INSTALL] {msg}", flush=True)

def main():
    log("Installing PyTorch with CUDA 12.1...")
    env = os.environ.copy()
    env["PIP_CACHE_DIR"] = str(CACHE_DIR)
    
    cmd_torch = [
        str(VENV_PY), "-m", "pip", "install",
        "torch", "torchvision",
        "--index-url", "https://download.pytorch.org/whl/cu121",
        "--cache-dir", str(CACHE_DIR)
    ]
    r = subprocess.run(cmd_torch, env=env)
    if r.returncode != 0:
        log("CUDA torch install failed or aborted. Falling back to default PyPI torch...")
        subprocess.run([str(VENV_PY), "-m", "pip", "install", "torch", "torchvision", "--cache-dir", str(CACHE_DIR)], env=env, check=True)
    
    log("Installing all remaining backend and ML dependencies...")
    cmd_reqs = [
        str(VENV_PY), "-m", "pip", "install",
        "-r", str(BASE_DIR / "requirements-all.txt"),
        "--cache-dir", str(CACHE_DIR)
    ]
    subprocess.run(cmd_reqs, env=env, check=True)
    log("Dependency installation complete!")

    # Check CUDA status
    r_cuda = subprocess.run([
        str(VENV_PY), "-c",
        "import torch; print('PyTorch Version:', torch.__version__); print('CUDA Available:', torch.cuda.is_available()); print('Device Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')"
    ], capture_output=True, text=True)
    log(f"PyTorch verification:\n{r_cuda.stdout.strip()}")

if __name__ == "__main__":
    main()
