import os
import sys
import platform
import shutil
import subprocess
import json

def get_disk_space():
    d_stat = shutil.disk_usage("D:\\")
    c_stat = shutil.disk_usage("C:\\")
    return {
        "D": {"free_gb": round(d_stat.free / (1024**3), 2), "total_gb": round(d_stat.total / (1024**3), 2)},
        "C": {"free_gb": round(c_stat.free / (1024**3), 2), "total_gb": round(c_stat.total / (1024**3), 2)}
    }

def get_cpu_ram():
    cores = os.cpu_count()
    ram_gb = None
    try:
        # Windows system info
        cmd = ["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize"]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            ram_gb = round(int(res.stdout.strip()) / (1024**2), 2)
    except Exception:
        pass
    return {"cpu_logical_cores": cores, "total_ram_gb": ram_gb}

def check_gpu():
    # Try nvidia-smi
    gpu_info = {"has_nvidia_gpu": False, "gpu_name": None, "vram_mb": None, "driver_version": None}
    try:
        res = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total,driver_version", "--format=csv,noheader,nounits"], capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            parts = [p.strip() for p in res.stdout.strip().split(",")]
            gpu_info = {
                "has_nvidia_gpu": True,
                "gpu_name": parts[0] if len(parts) > 0 else "Unknown",
                "vram_mb": float(parts[1]) if len(parts) > 1 else None,
                "driver_version": parts[2] if len(parts) > 2 else None
            }
    except Exception:
        pass
    return gpu_info

def check_software():
    node_v = None
    try:
        r = subprocess.run(["node", "-v"], capture_output=True, text=True)
        if r.returncode == 0:
            node_v = r.stdout.strip()
    except Exception:
        pass

    docker_status = "Not installed or not running"
    try:
        r = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if r.returncode == 0:
            r2 = subprocess.run(["docker", "ps"], capture_output=True, text=True)
            docker_status = f"Installed ({r.stdout.strip()}), daemon {'online' if r2.returncode == 0 else 'offline'}"
    except Exception:
        pass

    return {
        "python": sys.version.split()[0],
        "node": node_v or "Not in system PATH",
        "docker": docker_status,
        "platform": platform.platform()
    }

if __name__ == "__main__":
    recon = {
        "disk": get_disk_space(),
        "cpu_ram": get_cpu_ram(),
        "gpu": check_gpu(),
        "software": check_software()
    }
    print(json.dumps(recon, indent=2))
