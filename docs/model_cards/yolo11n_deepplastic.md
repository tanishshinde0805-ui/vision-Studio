# Model Card: Vision-Studio Oceanic Plastic Detector (DeepPlastic)

## Overview
- **Model Architecture**: YOLO11n (2.59M parameters)
- **Task**: Object Detection
- **Dataset**: DeepPlastic v1 Cleaned (1 classes)
- **Framework**: Ultralytics YOLO11 (Version 8.4.189, AGPL-3.0 License)
- **Weights License**: AGPL-3.0 / Research Use
- **Training Mode**: CPU-Baseline Sweep (Ryzen 5 5600H, 12 threads)

## Held-Out Test Evaluation (Zero Leakage)
- **mAP50**: 0.0304
- **mAP50-95**: 0.0057
- **Precision**: 0.1139
- **Recall**: 0.0585
- **CPU Latency**: 8.36 ms per frame (ONNX)

## Hyperparameters & Reproducibility
- **Seed**: 42
- **Image Size**: 320x320
- **Batch Size**: 8
- **Epochs**: 6
- **Optimizer**: AdamW
- **Augmentation Scheme**: underwater_hsv+mosaic
- **Checkpoint Artifact**: `finalist_deepplastic_yolo11n.onnx`

## Cross-Dataset Generalization
Evaluated on in-domain held-out test split.

## Limitations
- Model was trained on underwater camera feeds; degraded performance expected under extreme turbidity without artificial lighting.
- Acoustic sonar classification remains simulated and must not be fed to optical models.
