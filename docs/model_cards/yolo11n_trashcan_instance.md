# Model Card: Vision-Studio Underwater Object Detector (TrashCan)

## Overview
- **Model Architecture**: YOLO11n (2.59M parameters)
- **Task**: Object Detection
- **Dataset**: TrashCan 1.0 Instance (Leakage-Free) (22 classes)
- **Framework**: Ultralytics YOLO11 (Version 8.4.189, AGPL-3.0 License)
- **Weights License**: AGPL-3.0 / Research Use
- **Training Mode**: CPU-Baseline Sweep (Ryzen 5 5600H, 12 threads)

## Held-Out Test Evaluation (Zero Leakage)
- **mAP50**: 0.0041
- **mAP50-95**: 0.0010
- **Precision**: 0.5895
- **Recall**: 0.0177
- **CPU Latency**: 6.28 ms per frame (ONNX)

## Hyperparameters & Reproducibility
- **Seed**: 42
- **Image Size**: 320x320
- **Batch Size**: 8
- **Epochs**: 6
- **Optimizer**: AdamW
- **Augmentation Scheme**: underwater_hsv+mosaic
- **Checkpoint Artifact**: `finalist_trashcan_yolo11n.onnx`

## Cross-Dataset Generalization
Cross-dataset zero-shot mAP50 on DeepPlastic test split: 0.0102.

## Limitations
- Model was trained on underwater camera feeds; degraded performance expected under extreme turbidity without artificial lighting.
- Acoustic sonar classification remains simulated and must not be fed to optical models.
