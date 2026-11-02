# Vision-Studio Final: Architectural & Engineering Decisions

### Decision 1: Hardware Acceleration Strategy
- **Context**: Host possesses an NVIDIA GeForce RTX 3050 Laptop GPU (4 GB VRAM) alongside 12 logical CPU cores.
- **Decision**: Attempt PyTorch CUDA 12.1 installation inside isolated `.tmp/venv`. If CUDA initializes successfully, prioritize GPU training with batch size 16 and automatic mixed precision (`amp=True`) to maximize throughput while avoiding out-of-memory faults on 4 GB VRAM. If CUDA is unavailable or exceeds memory bounds, gracefully fall back to optimized CPU training and generate `gpu_kit/` (Colab/Kaggle notebook and standalone script).
- **Status**: Accepted & being executed.

### Decision 2: Cache & Directory Isolation
- **Context**: Guardrail strictly mandates that nothing outside `vision-studio-final` is modified or deleted.
- **Decision**: All pip caches (`PIP_CACHE_DIR`), PyTorch caches (`TORCH_HOME`), Ultralytics config (`YOLO_CONFIG_DIR`), Hugging Face (`HF_HOME`), npm caches, and Playwright browser binaries are mapped exclusively into `vision-studio-final/.tmp/`.
- **Status**: Accepted.

### Decision 3: Leakage-Free Data Splitting
- **Context**: Datasets (TrashCan, DeepPlastic) may contain frames extracted from identical video sequences or scenes across official splits.
- **Decision**: Group samples by scene/video ID (parsed from filenames) before assigning to train, validation, and test splits. Run perceptual hashing (`imagehash.phash`) across train vs test splits to catch and eliminate near-duplicate frames.
- **Status**: Accepted.

### Decision 4: Palette & Visual Language
- **Context**: The design concept is "survey chart meets instrument panel" organized around ocean depth.
- **Decision**: Adopt the custom tokens:
  - Abyss: `#0A2433` (deepest background)
  - Tide: `#0E6F7C` (structural framing, instrument borders)
  - Shallows: `#BFE3E6` (interactive secondary elements, telemetry lines)
  - Fog: `#EEF3F4` (high-contrast text, readout values in dark mode)
  - Signal: `#FF5A1F` (detections, alerts, high-confidence bounding boxes)
  No generic gradients, no cream washes, no neon, no all-caps labels.
- **Status**: Accepted.
