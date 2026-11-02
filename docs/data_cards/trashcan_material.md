# Dataset Card: TrashCan Material (Leakage-Free Partition)

## Overview
- **Name**: TrashCan 1.0 (Material Labeled)
- **Primary Domain**: Underwater debris material classification & segmentation
- **Original Source**: IRVLab, University of Minnesota
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)

## Taxonomy & Class Mapping
- Material classes: `trash_etc` (35), `trash_fabric` (36), `trash_fishing_gear` (37), `trash_metal` (38), `trash_paper` (39), `trash_plastic` (40), `trash_rubber` (41), `trash_wood` (42).
- Biological & ROV classes: `rov` (2), `plant` (14), `animal_*` (15-20).

## Partitioning
- Grouped by `vid_XXXXXX` with zero cross-split video leakage.
- Format: Bounding boxes (.txt) and polygonal segmentations (.txt).
