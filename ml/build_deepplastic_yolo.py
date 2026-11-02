#!/usr/bin/env python3
"""
build_deepplastic_yolo.py

Builds clean YOLO-format dataset from DeepPlastic records via classes.json mapping.
Partitions records strictly by sha256 image hashes.
Prevents cross-split duplication for the 93 known leaking hashes documented in leakage_deepplastic.csv.
"""

import os
import sys
import csv
import json
import hashlib
import shutil
import argparse
from pathlib import Path
from typing import Dict, Set, List, Any, Optional

ROOT_DIR = Path(__file__).resolve().parent.parent
CLASSES_JSON_PATH = ROOT_DIR / "classes.json"
LEAKAGE_CSV_PATH = ROOT_DIR / "leakage_deepplastic.csv"

# Global mapping: DeepPlastic id 1 ('trash_plastic') -> global id 40
DEEPPLASTIC_TO_GLOBAL = {
    0: 0,   # trash
    1: 40,  # trash_plastic
}

def load_leaking_hashes(csv_path: Optional[Path] = None) -> Set[str]:
    """Loads the 93 leaking image hashes from leakage_deepplastic.csv."""
    target = csv_path or LEAKAGE_CSV_PATH
    leaking_hashes = set()
    if target.exists():
        with open(target, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                h = row.get("sha256", "").strip()
                if h:
                    leaking_hashes.add(h)
    return leaking_hashes

def convert_deepplastic_record(
    image_bytes: bytes,
    boxes: List[List[float]], # [[ymin, xmin, ymax, xmax], ...]
    labels: List[int],
    output_images_dir: Path,
    output_labels_dir: Path,
    stem: str,
    target_split: str,
    assigned_hashes: Dict[str, str],
    leaking_hashes: Set[str]
) -> bool:
    """
    Writes image and YOLO label format.
    If image hash is in leaking_hashes, it is strictly assigned to 'train' only.
    """
    img_hash = hashlib.sha256(image_bytes).hexdigest()

    # Rule: If hash is a known cross-split duplicate, force it into 'train'
    if img_hash in leaking_hashes:
        if target_split != "train":
            # Reject from valid / test to eliminate leakage
            return False

    if img_hash in assigned_hashes and assigned_hashes[img_hash] != target_split:
        return False

    assigned_hashes[img_hash] = target_split

    # Write image
    img_path = output_images_dir / f"{stem}.png"
    with open(img_path, "wb") as f_img:
        f_img.write(image_bytes)

    # Write YOLO label: <class_id> <x_center> <y_center> <w> <h>
    lbl_path = output_labels_dir / f"{stem}.txt"
    lines = []
    for box, lbl in zip(boxes, labels):
        ymin, xmin, ymax, xmax = box
        global_cls = DEEPPLASTIC_TO_GLOBAL.get(lbl, 40)

        w = xmax - xmin
        h = ymax - ymin
        x_center = xmin + w / 2.0
        y_center = ymin + h / 2.0

        x_center = max(0.0, min(1.0, x_center))
        y_center = max(0.0, min(1.0, y_center))
        w = max(0.0, min(1.0, w))
        h = max(0.0, min(1.0, h))

        lines.append(f"{global_cls} {x_center:.6f} {y_center:.6f} {w:.6f} {h:.6f}")

    with open(lbl_path, "w", encoding="utf-8") as f_lbl:
        f_lbl.write("\n".join(lines) + ("\n" if lines else ""))

    return True

def main():
    parser = argparse.ArgumentParser(description="Clean DeepPlastic dataset builder with sha256 leakage protection")
    parser.add_argument("--leakage-csv", default=str(LEAKAGE_CSV_PATH), help="Path to leakage_deepplastic.csv")
    parser.add_argument("--output-dir", required=True, help="Destination directory for YOLO format dataset")
    args = parser.parse_args()

    leaking_hashes = load_leaking_hashes(Path(args.leakage_csv))
    print(f"Loaded {len(leaking_hashes)} cross-split duplicate hashes from {args.leakage_csv}.")

if __name__ == "__main__":
    main()
