# Dataset Card: TrashCan Instance (Leakage-Free Partition)

## Overview
- **Name**: TrashCan 1.0 (Instance Labeled)
- **Primary Domain**: Underwater visual debris and marine organism detection & segmentation
- **Original Source**: IRVLab, University of Minnesota (Hong, Fulton, Sattar - arXiv:2007.08097)
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)

## Taxonomy & Class Mapping
Mapped through `classes.json` (Unified 43-class taxonomy):
- `rov` -> ID 2
- `plant` -> ID 14
- `animal_fish` -> ID 15
- `animal_starfish` -> ID 16
- `animal_shells` -> ID 17
- `animal_crab` -> ID 18
- `animal_eel` -> ID 19
- `animal_etc` -> ID 20
- `trash_clothing` -> ID 21
- `trash_pipe` -> ID 22
- `trash_bottle` -> ID 23
- `trash_bag` -> ID 24
- `trash_snack_wrapper` -> ID 25
- `trash_can` -> ID 26
- `trash_cup` -> ID 27
- `trash_container` -> ID 28
- `trash_unknown_instance` -> ID 29
- `trash_branch` -> ID 30
- `trash_wreckage` -> ID 31
- `trash_tarp` -> ID 32
- `trash_rope` -> ID 33
- `trash_net` -> ID 34

## Leakage Protection & Partitioning
- **Vulnerability in Official Split**: The official train/val split shared 113 of 115 video sequences, causing high temporal leakage.
- **Remediation**: Grouped strictly by source video (`vid_XXXXXX`).
- **Splits**: 70% train / 15% validation / 15% held-out test split (carved with 0% video overlap).
- **Perceptual Hash Audit**: Cross-split image hash collision rate = 0.00%.
