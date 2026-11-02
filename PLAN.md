# Vision-Studio Final: Execution Plan & Master Roadmap

**Hardware Profile (Reconnaissance Phase 1)**:
- **Host**: Windows 11 / x64, 12 Logical CPU Cores, 15.34 GB RAM
- **GPU**: NVIDIA GeForce RTX 3050 Laptop GPU (4096 MB VRAM, Driver 581.83)
- **Disk Availability**: D:\ 136.8 GB free (25.0 GB download quota strictly respected)
- **Runtime Environment**: Python 3.11.9, Isolated Venv (`vision-studio-final/.tmp/venv`), Portable Node LTS v20.18.0

---

## Phases, Status & ETAs

| Phase | Description | Status | ETA / Duration | Deliverables / Artifacts |
| :--- | :--- | :---: | :---: | :--- |
| **Phase 1: Recon & Benchmark** | Hardware profiling, GPU/CPU throughput benchmark, ETAs | **DONE** | 41.1s | `recon.py`, `PLAN.md`, `BENCHMARK.json` |
| **Phase 2: Dataset Engineering** | Leakage-free YOLO datasets (detect + seg) from TrashCan & DeepPlastic; class balancing; 24-image verification; sonar public search & fallback; data cards | **DONE** | Complete | `datasets/`, data cards in `docs/data_cards/`, 72 overlay verifications |
| **Phase 3: Model Training & Sweeps** | Baseline, sweeps (YOLO11 n/s, YOLOv8 control, seg), augmentations, metrics, ONNX export & parity, model cards, `gpu_kit/` | **IN PROGRESS** | ~40 min | `experiments/EXPERIMENTS.csv`, best weights in `models/`, model cards in `docs/model_cards/`, `gpu_kit/` |
| **Phase 4: Backend & Integration** | Registry loading real weights, real inference default, fake only in DEMO_MODE, real-path parity & latency tests | **PENDING** | ~20 min | `ai-service/`, `api/`, green pytest suites |
| **Phase 5: Web UI Rebuild** | Precision instrument UI ("survey chart meets instrument panel"), Abyss/Tide/Shallows/Signal palette, Radix, TanStack Table/Query, Apache ECharts, Analysis viewer, Explain mode, Ctrl+K | **PENDING** | ~40 min | `web/src/`, `web/dist/`, `BUILD_REPORT.md` |
| **Phase 6: Review Loop & Gates** | Playwright responsive audit (375, 768, 1440px), Axe A11Y, Lighthouse >=90/95, contact sheets, design review | **PENDING** | ~25 min | `docs/screens/`, `docs/design-review.md`, Lighthouse audit reports |
| **Phase 7: Proof & Final Docs** | End-to-end roundtrip verification from clean manifests, cleanup of non-finalists, README, NOTICE, BUILD_REPORT | **PENDING** | ~15 min | Complete clean production package, final report |

---

## Phase 1 Benchmark & Throughput Profile
- **Compute Unit**: AMD Ryzen 5 5600H (12 threads)
- **Host GPU Observation**: NVIDIA RTX 3050 Laptop encountered CUDA illegal instruction with pre-built PyTorch 2.5.1 cu121 kernels on driver 581.83. In accordance with Prompt Specification 3, small models are trained at CPU-feasible settings (`imgsz=320`, batch=8, balanced subsets, fewer epochs), labeled `cpu-baseline`, and complemented with a full `gpu_kit/` (Colab/Kaggle notebook, script, README) for drop-in registry weights.
- **CPU Throughput**: 7.79 images / sec (128.4 ms / image training, 18.0 ms inference)
- **Target Training Budget**:
  - Balanced training subsets: 500 images &times; 10 epochs = 5,000 images = ~10.7 minutes per run
  - 4 planned sweeps (YOLO11n, YOLO11s, YOLOv8n control, YOLO11n-seg) = ~40-45 minutes total training compute time
- **Status**: Phase 1 Reconnaissance & Throughput Benchmark Completed. Proceeding to Phase 2 Dataset Engineering.
