import os
import sys
import time
import json
import ctypes
from pathlib import Path

# Windows keep-awake
ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
try:
    ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)
except Exception:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
TMP_DIR = BASE_DIR / ".tmp"
CACHE_DIR = TMP_DIR / "cache"

os.environ["TORCH_HOME"] = str(CACHE_DIR / "torch")
os.environ["YOLO_CONFIG_DIR"] = str(CACHE_DIR / "ultralytics")
os.environ["HF_HOME"] = str(CACHE_DIR / "huggingface")

def run_benchmark():
    import torch
    from ultralytics import YOLO

    device = "cpu"
    has_cuda = False
    device_name = f"12-Core Intel/AMD CPU ({os.cpu_count()} threads)"

    print("=" * 60, flush=True)
    print(f"RUNNING 2-MINUTE TRAINING THROUGHPUT BENCHMARK", flush=True)
    print(f"Device: {device} ({device_name})", flush=True)
    if has_cuda:
        print(f"VRAM Available: {torch.cuda.get_device_properties(0).total_memory / (1024**2):.1f} MB", flush=True)
    print("=" * 60, flush=True)

    # Build small synthetic YOLO dataset for benchmarking
    bench_dir = TMP_DIR / "bench_dataset"
    img_dir = bench_dir / "images" / "train"
    lbl_dir = bench_dir / "labels" / "train"
    img_dir.mkdir(parents=True, exist_ok=True)
    lbl_dir.mkdir(parents=True, exist_ok=True)

    from PIL import Image
    num_samples = 64
    for i in range(num_samples):
        img_path = img_dir / f"bench_{i:04d}.jpg"
        if not img_path.exists():
            img = Image.new("RGB", (640, 640), color=(15, 35, 60))
            img.save(img_path)
        lbl_path = lbl_dir / f"bench_{i:04d}.txt"
        if not lbl_path.exists():
            lbl_path.write_text("0 0.5 0.5 0.2 0.2\n")

    yaml_content = f"""
path: {bench_dir.as_posix()}
train: images/train
val: images/train
names:
  0: target
"""
    yaml_path = bench_dir / "data.yaml"
    yaml_path.write_text(yaml_content.strip())

    # Initialize YOLO11n
    print("Initializing YOLO11n model for throughput profiling...", flush=True)
    model = YOLO("yolo11n.yaml")

    start_time = time.time()
    batch_size = 8
    epochs = 5
    imgsz = 320
    print(f"Starting training run: batch={batch_size}, imgsz={imgsz}, epochs={epochs}, workers=0...", flush=True)
    t0 = time.time()
    results = model.train(
        data=str(yaml_path),
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        workers=0,
        val=False,
        plots=False,
        save=False,
        verbose=False
    )
    t1 = time.time()
    elapsed = t1 - t0
    images_processed = num_samples * epochs
    fps = images_processed / elapsed

    vram_peak_mb = 0
    if has_cuda:
        vram_peak_mb = torch.cuda.max_memory_allocated(0) / (1024**2)

    bench_summary = {
        "device": device_name,
        "cuda_available": has_cuda,
        "elapsed_seconds": round(elapsed, 2),
        "epochs": epochs,
        "images_processed": images_processed,
        "images_per_second": round(fps, 2),
        "batch_size": batch_size,
        "vram_peak_mb": round(vram_peak_mb, 2),
        "est_sec_per_1000_images": round(1000.0 / fps, 2),
        "est_20_epoch_trashcan_min": round((20 * 4000) / fps / 60.0, 1),
        "est_50_epoch_trashcan_min": round((50 * 4000) / fps / 60.0, 1)
    }

    print("\nBENCHMARK COMPLETE:", flush=True)
    print(json.dumps(bench_summary, indent=2), flush=True)

    # Save benchmark result
    out_file = BASE_DIR / "experiments" / "BENCHMARK.json"
    out_file.write_text(json.dumps(bench_summary, indent=2))
    return bench_summary

if __name__ == "__main__":
    run_benchmark()
