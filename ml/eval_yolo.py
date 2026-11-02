#!/usr/bin/env python3
"""
eval_yolo.py

Evaluation wrapper for YOLO models on unified underwater taxonomy.
"""

import sys
import argparse
from pathlib import Path

def evaluate(weights_or_yaml: str, data_yaml: str, imgsz: int = 64, device: str = "cpu"):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("Ultralytics not installed. Install requirements-ml.txt first.", file=sys.stderr)
        sys.exit(1)

    print(f"Loading model: {weights_or_yaml}")
    model = YOLO(weights_or_yaml)

    print(f"Evaluating on {data_yaml} (device: {device})...")
    metrics = model.val(
        data=data_yaml,
        imgsz=imgsz,
        device=device,
        verbose=True
    )
    return metrics

def main():
    parser = argparse.ArgumentParser(description="Ultralytics YOLO Evaluation Wrapper")
    parser.add_argument("--model", required=True, help="Path to weights (.pt) or architecture (.yaml)")
    parser.add_argument("--data", required=True, help="Path to data.yaml dataset descriptor")
    parser.add_argument("--imgsz", type=int, default=64, help="Input image dimension")
    parser.add_argument("--device", default="cpu", help="Device (cpu or 0)")
    args = parser.parse_args()

    evaluate(args.model, args.data, args.imgsz, args.device)

if __name__ == "__main__":
    main()
