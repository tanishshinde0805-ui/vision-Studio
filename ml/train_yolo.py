#!/usr/bin/env python3
"""
train_yolo.py

Training wrapper for YOLO models (Ultralytics) configured for underwater/sonar detection.
CPU device by default; supports custom data.yaml and architecture configs without downloading weights.
"""

import sys
import argparse
from pathlib import Path

def train(data_yaml: str, model_cfg: str, epochs: int = 1, imgsz: int = 64, device: str = "cpu"):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Ultralytics not installed. Install requirements-ml.txt first.", file=sys.stderr)
        sys.exit(1)

    print(f"Initializing YOLO model from config: {model_cfg} (device: {device})")
    model = YOLO(model_cfg) # Random weights init from yaml architecture

    print(f"Starting training on {data_yaml} for {epochs} epochs...")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        device=device,
        verbose=True
    )
    return results

def main():
    parser = argparse.ArgumentParser(description="Ultralytics YOLO Training Wrapper")
    parser.add_argument("--data", required=True, help="Path to data.yaml dataset descriptor")
    parser.add_argument("--model", default="yolov8n.yaml", help="Model config YAML (default: yolov8n.yaml)")
    parser.add_argument("--epochs", type=int, default=1, help="Number of training epochs")
    parser.add_argument("--imgsz", type=int, default=64, help="Input image dimension")
    parser.add_argument("--device", default="cpu", help="Device (cpu or 0)")
    args = parser.parse_args()

    train(args.data, args.model, args.epochs, args.imgsz, args.device)

if __name__ == "__main__":
    main()
