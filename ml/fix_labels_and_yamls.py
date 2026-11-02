import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
CLASSES_JSON_PATH = BASE_DIR / "classes.json"

with open(CLASSES_JSON_PATH, "r", encoding="utf-8") as f:
    class_data = json.load(f)
GLOBAL_CLASSES = {c["id"]: c["name"] for c in class_data["classes"]}

# 1. TrashCan Instance: 22 classes
# Global IDs: 2, 14, 15, ..., 34
TC_INST_GLOBALS = [2] + list(range(14, 35))
GLOBAL_TO_LOCAL_INST = {gid: idx for idx, gid in enumerate(TC_INST_GLOBALS)}

# 2. TrashCan Material: 16 classes
# Global IDs: 2, 14..20, 35..42
TC_MAT_GLOBALS = [2] + list(range(14, 21)) + list(range(35, 43))
GLOBAL_TO_LOCAL_MAT = {gid: idx for idx, gid in enumerate(TC_MAT_GLOBALS)}

# 3. DeepPlastic: 1 class (global 40 -> local 0)
GLOBAL_TO_LOCAL_DP = {40: 0, 0: 0}

def fix_dataset_labels(dataset_name: str, g2l_map: dict, globals_list: list):
    d_dir = DATASETS_DIR / dataset_name
    print(f"Fixing labels for {dataset_name}...")
    
    # Process labels in labels/ and labels_seg/ and subset/labels/
    label_folders = [
        d_dir / "labels" / "train",
        d_dir / "labels" / "val",
        d_dir / "labels" / "test",
        d_dir / "labels_seg" / "train",
        d_dir / "labels_seg" / "val",
        d_dir / "labels_seg" / "test",
        d_dir / "subset" / "labels" / "train",
        d_dir / "subset" / "labels" / "val"
    ]
    
    fixed_files = 0
    for folder in label_folders:
        if not folder.exists():
            continue
        for txt_file in folder.glob("*.txt"):
            content = txt_file.read_text(encoding="utf-8").strip()
            if not content:
                continue
            new_lines = []
            for line in content.split("\n"):
                parts = line.strip().split()
                if not parts:
                    continue
                orig_cls = int(parts[0])
                # Remap to local contiguous index
                local_cls = g2l_map.get(orig_cls, 0)
                new_lines.append(f"{local_cls} " + " ".join(parts[1:]))
            txt_file.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
            fixed_files += 1

    print(f"Fixed {fixed_files} label files in {dataset_name}.")

    # Generate standard YOLO YAMLs with names as a list of strings
    names_list = [GLOBAL_CLASSES[gid] for gid in globals_list]

    yaml_main = {
        "path": d_dir.as_posix(),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": names_list,
        "local_to_global": globals_list
    }
    with open(d_dir / "data.yaml", "w", encoding="utf-8") as f:
        json.dump(yaml_main, f, indent=2)

    # Subset YAML
    subset_dir = d_dir / "subset"
    if subset_dir.exists():
        yaml_sub = {
            "path": subset_dir.as_posix(),
            "train": "images/train",
            "val": "images/val",
            "names": names_list,
            "local_to_global": globals_list
        }
        with open(d_dir / "data-subset.yaml", "w", encoding="utf-8") as f:
            json.dump(yaml_sub, f, indent=2)

    # Seg YAML
    if (d_dir / "labels_seg").exists():
        yaml_seg = {
            "path": d_dir.as_posix(),
            "train": "images/train",
            "val": "images/val",
            "test": "images/test",
            "labels": "labels_seg",
            "names": names_list,
            "local_to_global": globals_list
        }
        with open(d_dir / "data-seg.yaml", "w", encoding="utf-8") as f:
            json.dump(yaml_seg, f, indent=2)

if __name__ == "__main__":
    fix_dataset_labels("trashcan_instance", GLOBAL_TO_LOCAL_INST, TC_INST_GLOBALS)
    fix_dataset_labels("trashcan_material", GLOBAL_TO_LOCAL_MAT, TC_MAT_GLOBALS)
    fix_dataset_labels("deepplastic", GLOBAL_TO_LOCAL_DP, [40])
    print("All dataset YAMLs and label indices updated to valid contiguous 0..nc-1 ranges!")
