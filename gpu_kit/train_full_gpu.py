#!/usr/bin/env python3
# gpu_kit/train_full_gpu.py
# Standalone high-throughput training script for NVIDIA A100 / T4 GPUs

import os
from ultralytics import YOLO

def main():
    print("=== Vision-Studio Full Scale GPU Training (100 Epochs, imgsz=640) ===")
    
    # 1. Full Scale TrashCan Detection Finalist
    m_detect = YOLO("yolo11n.yaml")
    m_detect.train(
        data="datasets/trashcan_instance/data.yaml",
        epochs=100,
        imgsz=640,
        batch=32,
        device=0,
        workers=8,
        optimizer="AdamW",
        hsv_h=0.03, hsv_s=0.7, hsv_v=0.4, mosaic=1.0,
        project="runs/detect",
        name="yolo11n_trashcan_gpu_100ep"
    )
    m_detect.export(format="onnx", imgsz=640)
    print("Full scale training complete. Exported weights to runs/detect/yolo11n_trashcan_gpu_100ep/")

if __name__ == "__main__":
    main()
