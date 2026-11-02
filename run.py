#!/usr/bin/env python3
"""
vision-studio/run.py

Unified orchestration launcher for Vision-Studio.
Starts AI-Service, API Gateway (which also serves the web SPA).
Redirects caches to .tmp; never downloads model weights.

Usage:
  python run.py          # production mode (serves web/dist via API)
  python run.py dev      # dev mode (hot-reload Node Vite + API)
  python run.py dev --demo   # dev + demo data enabled
"""

import os
import sys
import time
import json
import shutil
import signal
import argparse
import subprocess
import threading
import webbrowser
from pathlib import Path
from typing import List, Tuple

BASE_DIR = Path(__file__).resolve().parent
AI_DIR = BASE_DIR / "ai-service"
API_DIR = BASE_DIR / "api"
WEB_DIR = BASE_DIR / "web"
TMP_DIR = BASE_DIR / ".tmp"
CACHE_DIR = TMP_DIR / "cache"
NODE_DIR = TMP_DIR / "node"
LOG_DIR = TMP_DIR / "logs"

# Node LTS portable zip (Windows x64) — only downloaded if Node is not found
NODE_VERSION = "20.18.0"
NODE_ZIP_URL = f"https://nodejs.org/dist/v{NODE_VERSION}/node-v{NODE_VERSION}-win-x64.zip"
NODE_EXE = NODE_DIR / f"node-v{NODE_VERSION}-win-x64" / "node.exe"
NPM_CMD = NODE_DIR / f"node-v{NODE_VERSION}-win-x64" / "npm.cmd"


def log(tag: str, msg: str):
    print(f"[{tag}] {msg}", flush=True)


def setup_environment(demo_mode: bool = False):
    """Configure isolated cache directories, never touching system paths."""
    for sub in ["pip", "torch", "ultralytics", "huggingface", "npm", "playwright"]:
        (CACHE_DIR / sub).mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    os.environ["TORCH_HOME"] = str(CACHE_DIR / "torch")
    os.environ["YOLO_CONFIG_DIR"] = str(CACHE_DIR / "ultralytics")
    os.environ["HF_HOME"] = str(CACHE_DIR / "huggingface")
    os.environ["PIP_CACHE_DIR"] = str(CACHE_DIR / "pip")
    os.environ["npm_config_cache"] = str(CACHE_DIR / "npm")
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = str(CACHE_DIR / "playwright")
    os.environ["CLASSES_JSON_PATH"] = str(BASE_DIR / "classes.json")
    os.environ["DATABASE_URL"] = f"sqlite:///{BASE_DIR / 'vision_studio.db'}"
    if demo_mode:
        os.environ["DEMO_MODE"] = "1"


def find_python() -> str:
    """Prefer venv python if available, fall back to current interpreter."""
    venv_py = TMP_DIR / "venv" / "Scripts" / "python.exe"
    if not venv_py.exists():
        venv_py = TMP_DIR / "venv" / "bin" / "python"
    return str(venv_py) if venv_py.exists() else sys.executable


def ensure_python_env() -> str:
    """Ensure python has fastapi and uvicorn; create isolated .tmp/venv if missing."""
    py_exec = find_python()
    r = subprocess.run([py_exec, "-c", "import fastapi, uvicorn"], capture_output=True)
    if r.returncode == 0:
        return py_exec

    venv_dir = TMP_DIR / "venv"
    venv_py = venv_dir / "Scripts" / "python.exe"
    if sys.platform != "win32":
        venv_py = venv_dir / "bin" / "python"

    if not venv_py.exists():
        log("env", f"Creating isolated virtual environment in {venv_dir}...")
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)

    log("env", "Installing backend dependencies into isolated .tmp/venv...")
    pip_cache = CACHE_DIR / "pip"
    pip_cache.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        str(venv_py), "-m", "pip", "install", "--quiet",
        "--cache-dir", str(pip_cache),
        "-r", str(AI_DIR / "requirements.txt"),
        "-r", str(API_DIR / "requirements.txt"),
    ], check=True)
    log("env", "Backend dependencies ready.")
    return str(venv_py)


def find_node() -> Tuple[str, str]:
    """Find node/npm: system PATH first, then .tmp/node, then portable download."""
    # 1. System PATH
    node_sys = shutil.which("node")
    npm_sys = shutil.which("npm")
    if node_sys and npm_sys:
        return node_sys, npm_sys

    # 2. Previously downloaded portable node
    if (NODE_DIR / "node.exe").exists() and (NODE_DIR / "npm.cmd").exists():
        return str(NODE_DIR / "node.exe"), str(NODE_DIR / "npm.cmd")
    if NODE_EXE.exists() and NPM_CMD.exists():
        return str(NODE_EXE), str(NPM_CMD)

    return "", ""


def download_portable_node() -> Tuple[str, str]:
    """Download Node LTS portable zip to .tmp/node (no PATH/system changes)."""
    import urllib.request
    import zipfile

    NODE_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = NODE_DIR / f"node-v{NODE_VERSION}-win-x64.zip"

    if not NODE_EXE.exists():
        log("node", f"Downloading portable Node v{NODE_VERSION} to {zip_path}...")
        log("node", f"URL: {NODE_ZIP_URL}")
        try:
            urllib.request.urlretrieve(NODE_ZIP_URL, str(zip_path))
            log("node", "Extracting...")
            with zipfile.ZipFile(str(zip_path), "r") as z:
                z.extractall(str(NODE_DIR))
            zip_path.unlink(missing_ok=True)
            log("node", f"Node extracted to {NODE_DIR}")
        except Exception as exc:
            log("node", f"Download failed: {exc}. Running without Node (prod mode only).")
            return "", ""

    if NODE_EXE.exists() and NPM_CMD.exists():
        return str(NODE_EXE), str(NPM_CMD)
    return "", ""


def build_web(node_exe: str, npm_cmd: str):
    """Run npm install + npm run build in web/."""
    if not node_exe or not npm_cmd:
        log("web", "Node not available — skipping web build.")
        return False

    log("web", "Installing npm packages...")
    env = os.environ.copy()
    env["npm_config_cache"] = str(CACHE_DIR / "npm")

    r = subprocess.run([npm_cmd, "install"], cwd=str(WEB_DIR), env=env, capture_output=True, text=True)
    if r.returncode != 0:
        log("web", f"npm install failed:\n{r.stderr}")
        return False

    log("web", "Building production bundle...")
    r = subprocess.run([npm_cmd, "run", "build"], cwd=str(WEB_DIR), env=env, capture_output=True, text=True)
    if r.returncode != 0:
        log("web", f"npm build failed:\n{r.stderr}")
        return False

    log("web", "Production build complete: web/dist/")
    return True


def run_prod(args):
    """Production mode: build web (if needed), start AI+API, open browser."""
    setup_environment(demo_mode=getattr(args, "demo", False))
    py_exec = ensure_python_env()

    print("=" * 65)
    print("  Vision-Studio: Underwater & Sonar AI Analysis Platform")
    print("=" * 65)

    # Find/download node for build
    node_exe, npm_cmd = find_node()
    if not node_exe:
        log("node", "Node not in PATH. Attempting to download portable Node LTS...")
        node_exe, npm_cmd = download_portable_node()

    # Build if dist doesn't exist or if --rebuild requested
    web_dist = WEB_DIR / "dist" / "index.html"
    if not web_dist.exists() or getattr(args, "rebuild", False):
        ok = build_web(node_exe, npm_cmd)
        if not ok:
            if not web_dist.exists():
                log("web", "WARNING: web/dist not built. API runs but will return 404 for /")
    else:
        log("web", f"Using existing web/dist/ (pass --rebuild to rebuild)")

    api_port = getattr(args, "api_port", 5000)
    ai_port = getattr(args, "ai_port", 8000)
    host = getattr(args, "host", "127.0.0.1")

    processes: List[Tuple[str, subprocess.Popen]] = []

    env_ai = os.environ.copy()
    env_ai["PYTHONPATH"] = f"{AI_DIR};{BASE_DIR}"

    env_api = os.environ.copy()
    env_api["PYTHONPATH"] = f"{API_DIR};{BASE_DIR}"
    env_api["AI_SERVICE_URL"] = f"http://127.0.0.1:{ai_port}"

    try:
        log("ai-service", f"Starting on port {ai_port}...")
        p_ai = subprocess.Popen(
            [py_exec, "-m", "uvicorn", "main:app", "--host", host, "--port", str(ai_port)],
            cwd=str(AI_DIR), env=env_ai
        )
        processes.append(("ai-service", p_ai))

        log("api", f"Starting on port {api_port}...")
        p_api = subprocess.Popen(
            [py_exec, "-m", "uvicorn", "main:app", "--host", host, "--port", str(api_port)],
            cwd=str(API_DIR), env=env_api
        )
        processes.append(("api", p_api))

        time.sleep(2)
        if getattr(args, "demo", False):
            import urllib.request
            try:
                req = urllib.request.Request(f"http://127.0.0.1:{api_port}/api/v1/demo/load?count=400", method="POST")
                with urllib.request.urlopen(req, timeout=10) as resp:
                    log("demo", "Seeded 400 synthetic analyses tagged source=demo into mission database.")
            except Exception as e:
                log("demo", f"Demo seeding: {e}")

        url = f"http://localhost:{api_port}"
        log("web", f"Opening browser: {url}")
        print(f"\n  App: {url}")
        print(f"  API docs: {url}/docs")
        print(f"\n  Press Ctrl+C to stop.\n")
        webbrowser.open(url)

        while True:
            for name, p in processes:
                ret = p.poll()
                if ret is not None:
                    log(name, f"exited with code {ret}")
                    raise KeyboardInterrupt
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[vision-studio] Shutting down...")
        for name, p in processes:
            try:
                p.terminate()
                p.wait(timeout=5)
            except Exception:
                p.kill()
        print("[vision-studio] All services stopped.")


def run_dev(args):
    """Dev mode: start AI, API, and Vite dev server (hot reload)."""
    setup_environment(demo_mode=getattr(args, "demo", False))
    py_exec = ensure_python_env()

    node_exe, npm_cmd = find_node()
    if not node_exe:
        log("node", "Node not available. Dev mode requires Node. Falling back to prod mode...")
        run_prod(args)
        return

    api_port = getattr(args, "api_port", 5000)
    ai_port = getattr(args, "ai_port", 8000)
    web_port = getattr(args, "web_port", 5173)
    host = getattr(args, "host", "127.0.0.1")

    print("=" * 65)
    print("  Vision-Studio: Dev Mode (hot reload)")
    print("=" * 65)
    print(f"  AI-Service: http://localhost:{ai_port}")
    print(f"  API:        http://localhost:{api_port}")
    print(f"  Web:        http://localhost:{web_port}")
    print("=" * 65)

    processes: List[Tuple[str, subprocess.Popen]] = []
    env_ai = os.environ.copy()
    env_ai["PYTHONPATH"] = f"{AI_DIR};{BASE_DIR}"
    env_api = os.environ.copy()
    env_api["PYTHONPATH"] = f"{API_DIR};{BASE_DIR}"
    env_api["AI_SERVICE_URL"] = f"http://127.0.0.1:{ai_port}"

    npm_env = os.environ.copy()
    npm_env["npm_config_cache"] = str(CACHE_DIR / "npm")

    try:
        log("ai-service", f"Starting on port {ai_port}...")
        p_ai = subprocess.Popen(
            [py_exec, "-m", "uvicorn", "main:app", "--host", host, "--port", str(ai_port), "--reload"],
            cwd=str(AI_DIR), env=env_ai
        )
        processes.append(("ai-service", p_ai))

        log("api", f"Starting on port {api_port}...")
        p_api = subprocess.Popen(
            [py_exec, "-m", "uvicorn", "main:app", "--host", host, "--port", str(api_port), "--reload"],
            cwd=str(API_DIR), env=env_api
        )
        processes.append(("api", p_api))

        log("web", "Installing npm deps...")
        subprocess.run([npm_cmd, "install"], cwd=str(WEB_DIR), env=npm_env, check=True)

        log("web", f"Starting Vite dev server on port {web_port}...")
        p_web = subprocess.Popen(
            [npm_cmd, "run", "dev", "--", "--host", host, "--port", str(web_port)],
            cwd=str(WEB_DIR), env=npm_env
        )
        processes.append(("web", p_web))

        time.sleep(3)
        webbrowser.open(f"http://localhost:{web_port}")
        print("\n  Press Ctrl+C to stop.\n")

        while True:
            for name, p in processes:
                ret = p.poll()
                if ret is not None:
                    log(name, f"exited with code {ret}")
                    raise KeyboardInterrupt
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[vision-studio] Shutting down dev servers...")
        for name, p in processes:
            try:
                p.terminate()
                p.wait(timeout=5)
            except Exception:
                p.kill()
        print("[vision-studio] All dev servers stopped.")


def main():
    parser = argparse.ArgumentParser(
        prog="vision-studio",
        description="Vision-Studio: Full-Stack Underwater & Sonar AI Detection Platform"
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--api-port", type=int, default=5000)
    parser.add_argument("--ai-port", type=int, default=8000)
    parser.add_argument("--web-port", type=int, default=5173)
    parser.add_argument("--demo", action="store_true", default=False)
    parser.add_argument("--rebuild", action="store_true", default=False, help="Force rebuild of web/dist")

    subparsers = parser.add_subparsers(dest="command")
    dev_parser = subparsers.add_parser("dev", help="Start with hot reload (requires Node)")
    dev_parser.add_argument("--demo", action="store_true", default=False)
    dev_parser.add_argument("--host", default="127.0.0.1")
    dev_parser.add_argument("--api-port", type=int, default=5000)
    dev_parser.add_argument("--ai-port", type=int, default=8000)
    dev_parser.add_argument("--web-port", type=int, default=5173)

    args = parser.parse_args()

    if args.command == "dev":
        run_dev(args)
    else:
        run_prod(args)


if __name__ == "__main__":
    main()
