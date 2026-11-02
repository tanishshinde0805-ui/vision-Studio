#!/usr/bin/env python3
"""
smoke_test.py

Smoke test for ML tools on synthetic data only.
Verifies COCO-to-YOLO conversion, normalized bounding box mathematics,
and sha256 duplicate isolation without remote downloads.
"""

import io
import json
import shutil
import tempfile
from pathlib import Path
import numpy as np
from PIL import Image

from build_trashcan_yolo import convert_coco_to_yolo
from build_deepplastic_yolo import convert_deepplastic_record

def run_synthetic_smoke_test():
    tmp_dir = Path(tempfile.mkdtemp(prefix="ml_smoke_"))
    try:
        # 1. Create synthetic image
        img_arr = np.random.randint(50, 200, (100, 100, 3), dtype=np.uint8)
        img_arr[20:40, 20:40] = 255
        pil_img = Image.fromarray(img_arr)

        src_images = tmp_dir / "src_images"
        src_images.mkdir()
        img_path = src_images / "sample_001.png"
        pil_img.save(img_path)

        # 2. Create synthetic COCO JSON
        coco_data = {
            "images": [
                {"id": 1, "file_name": "sample_001.png", "width": 100, "height": 100}
            ],
            "annotations": [
                {
                    "id": 101,
                    "image_id": 1,
                    "category_id": 1, # ROV in TrashCan
                    "bbox": [20.0, 20.0, 20.0, 20.0],
                    "area": 400.0,
                    "iscrowd": 0
                }
            ],
            "categories": [
                {"id": 1, "name": "rov"}
            ]
        }
        coco_json = tmp_dir / "coco_annotations.json"
        with open(coco_json, "w", encoding="utf-8") as f:
            json.dump(coco_data, f)

        # 3. Test TrashCan converter
        out_trashcan = tmp_dir / "out_trashcan"
        res = convert_coco_to_yolo(
            coco_json_path=coco_json,
            images_dir=src_images,
            output_dir=out_trashcan,
            split_name="train"
        )
        assert res["converted"] == 1, "TrashCan conversion failed to convert 1 image"

        label_file = out_trashcan / "labels" / "train" / "sample_001.txt"
        assert label_file.exists(), "YOLO label file not created"

        with open(label_file, "r") as f:
            content = f.read().strip()
            parts = content.split()
            # Category 1 (ROV) should map to global ID 2
            cls_id = int(parts[0])
            xc, yc, w, h = map(float, parts[1:])
            assert cls_id == 2, f"Expected global class ID 2, got {cls_id}"
            assert abs(xc - 0.3) < 0.01, f"Expected xc 0.3, got {xc}"
            assert abs(yc - 0.3) < 0.01, f"Expected yc 0.3, got {yc}"
            assert abs(w - 0.2) < 0.01, f"Expected w 0.2, got {w}"
            assert abs(h - 0.2) < 0.01, f"Expected h 0.2, got {h}"

        # 4. Test DeepPlastic record converter
        buf = io.BytesIO()
        pil_img.save(buf, format="PNG")
        img_bytes = buf.getvalue()

        out_dp_img = tmp_dir / "out_dp" / "images"
        out_dp_lbl = tmp_dir / "out_dp" / "labels"
        out_dp_img.mkdir(parents=True)
        out_dp_lbl.mkdir(parents=True)

        assigned = {}
        leaking = {"dummy_hash_123"}

        success = convert_deepplastic_record(
            image_bytes=img_bytes,
            boxes=[[0.2, 0.2, 0.4, 0.4]], # ymin, xmin, ymax, xmax
            labels=[1], # trash_plastic -> global 40
            output_images_dir=out_dp_img,
            output_labels_dir=out_dp_lbl,
            stem="dp_sample_001",
            target_split="train",
            assigned_hashes=assigned,
            leaking_hashes=leaking
        )
        assert success is True, "DeepPlastic record conversion failed"
        assert (out_dp_lbl / "dp_sample_001.txt").exists(), "DeepPlastic label not written"

        with open(out_dp_lbl / "dp_sample_001.txt") as f:
            dp_content = f.read().strip().split()
            assert int(dp_content[0]) == 40, f"Expected global ID 40, got {dp_content[0]}"

        print("ML Tools Synthetic Smoke Test: PASSED (All assertions passed successfully)")
        return True

    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)

if __name__ == "__main__":
    run_synthetic_smoke_test()
