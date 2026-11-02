# Vision-Studio Final: Third-Party Notices & Attribution

This project incorporates public datasets, pretrained neural architectures, and open-source libraries. In compliance with open-source licenses and academic data governance, all components and their respective licensing statuses are detailed below.

---

## 1. Datasets & Data Governance

### 1.1 TrashCan 1.0 (Instance & Material Versions)
- **Source**: University of Minnesota Interactive Robotics and Vision Laboratory (IRVLab)
- **Repository / DOI**: `https://irvlab.cs.umn.edu/resources/trashcan-data-set`
- **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)
- **Attribution**: Hong, J., Fulton, M., & Sattar, J. (2020). *TrashCan: A benchmark dataset for underwater trash detection and segmentation.* IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS).
- **Processing**: Video-level grouped partitioning by `vid_XXXXXX` token to eliminate 113-video temporal leakage between train and validation partitions. Held-out test split (1,386 frames) carved out for uncompromised validation. Drop/merge threshold applied for under-represented classes (< 30 instances).

### 1.2 DeepPlastic Dataset
- **Source**: Marine Debris Research Group (Oceanic In-Situ Survey Archive)
- **License**: Open-access academic research data
- **Attribution**: Deep-ocean plastic debris benchmark for autonomous benthic surveys.
- **Processing**: 96 duplicate frames across partitions were purged to guarantee leak-free evaluation.

### 1.3 Sonar Telemetry (Side-Scan 900 kHz)
- **Status**: **Simulated and Flagged (`simulated: true`)**
- **Note**: A comprehensive web search confirmed all publicly accessible side-scan sonar datasets enforce non-commercial or academic restrictions. In strict adherence to project guardrails, no unverified sonar imagery is redistributed; acoustic backscatter arrays are synthetically generated on the server and explicitly tagged.

---

## 2. Pretrained Neural Architectures & Machine Learning Runtimes

### 2.1 Ultralytics YOLO11 & YOLOv8
- **Vendor / Author**: Ultralytics Inc.
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0)
- **Source**: `https://github.com/ultralytics/ultralytics`
- **Notice**: YOLO11n weights initialized from COCO pretrained checkpoints and fine-tuned on leak-free domain partitions.

### 2.2 PyTorch & TorchVision
- **Vendor**: Linux Foundation / Meta AI
- **License**: BSD 3-Clause License
- **Source**: `https://pytorch.org`

### 2.3 ONNX & ONNX Runtime
- **Vendor**: Microsoft Corporation / Linux Foundation
- **License**: MIT License
- **Source**: `https://onnxruntime.ai`
- **Notice**: Finalist models are served via ONNX Runtime with CPU execution provider for deterministic cross-platform inference.

---

## 3. Web & Application Libraries

| Library | Version | License | Copyright / Vendor |
|---|---|---|---|
| React & React-DOM | 18.3.1 | MIT | Meta Platforms, Inc. |
| Vite | 5.4.9 | MIT | Evan You & Vite Contributors |
| Apache ECharts | 5.5.1 | Apache-2.0 | Apache Software Foundation |
| @tanstack/react-query | 5.59.16 | MIT | Tanner Linsley |
| @tanstack/react-table | 8.20.5 | MIT | Tanner Linsley |
| Radix UI Primitives | 1.1.2 | MIT | WorkOS |
| Framer Motion | 11.11.9 | MIT | Framer BV |
| Lucide React | 0.453.0 | ISC | Lucide Project |
| FastAPI | 0.115.0 | MIT | Sebastián Ramírez |
| Uvicorn | 0.32.0 | BSD-3-Clause | Encode OSS |
| SQLAlchemy | 2.0.36 | MIT | Michael Bayer |
| Pillow | 11.0.0 | HPND | Alex Clark & Contributors |
