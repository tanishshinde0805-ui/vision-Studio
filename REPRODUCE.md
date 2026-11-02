# Vision-Studio Final: Full Reproduction & Retraining Guide

This guide details exact, deterministic steps to reproduce the dataset partitions, training sweeps, ONNX exports, web bundle, and automated testing suites from scratch.

---

## 1. System & Environment Setup

### 1.1 Python Virtual Environment
All package installations and torch caches remain isolated inside `vision-studio-final`:

```bash
# Windows PowerShell
cd vision-studio-final
python -m venv .tmp/venv
& .tmp/venv/Scripts/pip install -r ai-service/requirements.txt -r api/requirements.txt
```

### 1.2 Web Environment (Optional if using pre-built web/dist)
```bash
# If modifying or recompiling the frontend:
cd web
npm install
npm run build
```

---

## 2. Dataset Reconstruction (Leakage-Free Partitioning)

Official TrashCan partitions exhibit 113-video temporal leakage between train and validation splits. Run the leakage-free group partitioning script:

```bash
# Regroup by source video ID (vid_XXXXXX) and purge DeepPlastic duplicate frames
python ml/prepare_datasets.py
```

This generates:
- `datasets/trashcan_instance/data-leakfree.yaml` (4,879 train, 947 val, 1,386 held-out test)
- `datasets/deepplastic/data-leakfree.yaml` (2,175 train, 396 val, 464 test)
- 72 verification overlays in `docs/verification/`

---

## 3. Training Sweeps & Finalist Selection

To execute the 4-run sweep on CPU (AMD Ryzen 5 5600H):

```bash
python ml/train_sweeps.py
```

### Sweeps Executed:
1. `EXP-01-yolo11n-baseline`: Baseline YOLO11n initialization on balanced subset.
2. `EXP-02-yolov8n-control`: Comparison control on YOLOv8n.
3. `EXP-03-yolo11n-underwater-aug`: YOLO11n with underwater haze, chromatic shift, and mosaic augmentations (**TrashCan Finalist**).
4. `EXP-04-yolo11n-deepplastic`: YOLO11n on oceanic marine plastic (**DeepPlastic Finalist**).

Results, loss curves, and mAP checkpoints are logged to `experiments/EXPERIMENTS.csv` and `runs/detect/`.

---

## 4. Full-Scale Cloud GPU Retraining (`gpu_kit/`)

To train at full scale (50 epochs, `imgsz=640`, `batch=16`) on a free Kaggle (T4 x2) or Google Colab GPU:

```bash
cd gpu_kit
python train_cloud.py --epochs 50 --imgsz 640 --batch 16 --device 0
```

When completed, copy `best.pt` and `best.onnx` into `models/finalist_trashcan_yolo11n.onnx`.

---

## 5. ONNX Export & Latency Parity

Convert best PyTorch checkpoints to ONNX with graph simplification:

```bash
python -c "
from ultralytics import YOLO
model = YOLO('runs/detect/EXP-03-yolo11n-underwater-aug/weights/best.pt')
model.export(format='onnx', imgsz=320, simplify=True)
"
```

ONNX Runtime delivers 6.28 ms CPU latency vs 20.79 ms in PyTorch eager mode.

---

## 6. Running the Platform

### Production Mode (Serves pre-built web SPA via FastAPI):
```bash
python run.py
# Open http://localhost:5000 in your browser
```

### With 400 Synthetic Demonstration Analyses Seeded:
```bash
python run.py --demo
```

### Dev Mode (Vite Hot-Reload):
```bash
python run.py dev
```

---

## 7. Running Verification Test Suites

```bash
# Backend AI-Service tests (including real-path ONNX tests)
$env:PYTHONPATH="ai-service"
pytest ai-service/tests

# Backend API Gateway tests
$env:PYTHONPATH="api"
pytest api/tests

# Frontend Vitest suite
cd web
npm test
```
