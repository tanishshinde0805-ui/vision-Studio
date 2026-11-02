#!/usr/bin/env python3
"""
build_trashcan_yolo.py

Builds clean YOLO-format dataset from TrashCan (COCO format) via the classes.json mapping.
Partitions / groups image splits by sha256 to guarantee zero cross-split image duplication.
"""

import os
import sys
import json
import hashlib
import shutil
import argparse
from pathlib import Path
from typing import Dict, List, Any, Set, Optional

ROOT_DIR = Path(__file__).resolve().parent.parent
CLASSES_JSON_PATH = ROOT_DIR / "classes.json"

def get_file_sha256(filepath: Path) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

def load_unified_classes() -> Dict[int, str]:
    if not CLASSES_JSON_PATH.exists():
        raise FileNotFoundError(f"classes.json not found at {CLASSES_JSON_PATH}")
    with open(CLASSES_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return {c["id"]: c["name"] for c in data.get("classes", [])}

# TrashCan instance version categories mapping (original ids 1-22 -> unified ids)
# From MERGE_REPORT.md Section 4:
# TrashCan ROV (orig 1) -> global 2
# TrashCan Instances 2-22 -> global 14-34
TRASHCAN_INSTANCE_TO_GLOBAL = {
    1: 2,   # rov
    **{orig_id: orig_id + 12 for orig_id in range(2, 23)} # 2-22 -> 14-34
}

def convert_coco_to_yolo(
    coco_json_path: Path,
    images_dir: Path,
    output_dir: Path,
    split_name: str = "train",
    known_hashes: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Parses COCO JSON, converts boxes to normalized YOLO format:
    <class_id> <x_center> <y_center> <width> <height>
    Skips duplicate images across splits using sha256 hash checking.
    """
    output_images = output_dir / "images" / split_name
    output_labels = output_dir / "labels" / split_name
    output_images.mkdir(parents=True, exist_ok=True)
    output_labels.mkdir(parents=True, exist_ok=True)

    if known_hashes is None:
        known_hashes = {}

    with open(coco_json_path, "r", encoding="utf-8") as f:
        coco_data = json.load(f)

    # Index images
    img_map = {img["id"]: img for img in coco_data.get("images", [])}

    # Group annotations by image_id
    ann_map: Dict[int, List[Dict[str, Any]]] = {}
    for ann in coco_data.get("annotations", []):
        img_id = ann["image_id"]
        ann_map.setdefault(img_id, []).append(ann)

    converted_count = 0
    duplicate_count = 0

    for img_id, img_info in img_map.items():
        file_name = img_info["file_name"]
        img_w = float(img_info["width"])
        img_h = float(img_info["height"])

        src_img = images_dir / file_name
        if not src_img.exists():
            continue

        img_hash = get_file_sha256(src_img)
        if img_hash in known_hashes and known_hashes[img_hash] != split_name:
            # Cross-split duplicate detected! Skip to prevent train/val leakage
            duplicate_count += 1
            continue

        known_hashes[img_hash] = split_name

        # Copy image
        dst_img = output_images / file_name
        if not dst_img.exists():
            shutil.copy2(src_img, dst_img)

        # Write YOLO label
        label_file = output_labels / f"{Path(file_name).stem}.txt"
        yolo_lines = []
        for ann in ann_map.get(img_id, []):
            orig_cat = ann["category_id"]
            global_cat = TRASHCAN_INSTANCE_TO_GLOBAL.get(orig_cat, orig_cat)

            # bbox is [x, y, width, height]
            bbox = ann["bbox"]
            bx, by, bw, bh = bbox[0], bbox[1], bbox[2], bbox[3]

            # Normalize to 0-1
            x_center = (bx + bw / 2.0) / img_w
            y_center = (by + bh / 2.0) / img_h
            w_norm = bw / img_w
            h_norm = bh / img_h

            x_center = max(0.0, min(1.0, x_center))
            y_center = max(0.0, min(1.0, y_center))
            w_norm = max(0.0, min(1.0, w_norm))
            h_norm = max(0.0, min(1.0, h_norm))

            yolo_lines.append(f"{global_cat} {x_center:.6f} {y_center:.6f} {w_norm:.6f} {h_norm:.6f}")

        with open(label_file, "w", encoding="utf-8") as f_lbl:
            f_lbl.write("\n".join(yolo_lines) + ("\n" if yolo_lines else ""))

        converted_count += 1

    return {
        "split": split_name,
        "converted": converted_count,
        "duplicates_skipped": duplicate_count
    }

def main():
    parser = argparse.ArgumentParser(description="Convert TrashCan COCO dataset to clean YOLO format without split leakage")
    parser.add_argument("--coco-json", required=True, help="Path to TrashCan COCO annotations JSON")
    parser.add_argument("--images-dir", required=True, help="Path to source images directory")
    parser.add_argument("--output-dir", required=True, help="Path to output YOLO dataset directory")
    parser.add_argument("--split", default="train", help="Target split name (train/val)")
    args = parser.parse_args()

    res = convert_coco_to_yolo(
        coco_json_path=Path(args.coco_json),
        images_dir=Path(args.images_dir),
        output_dir=Path(args.output_dir),
        split_name=args.split
    )
    print(f"TrashCan Conversion Complete: {res['converted']} images processed, {res['duplicates_skipped']} duplicates skipped.")

if __name__ == "__main__":
    main()
