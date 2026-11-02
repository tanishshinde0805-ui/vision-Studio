# Dataset Card: DeepPlastic (Roboflow Cleaned)

## Overview
- **Name**: DeepPlastic v1 (DeepTrash)
- **Primary Domain**: In-situ oceanic plastic debris detection
- **License**: Open Database License / Research Permissive
- **Unified Class**: ID 40 (`trash_plastic`)

## Leakage Audit
- **Vulnerability**: Roboflow augmentations produced 93 exact duplicate frames across train/val/test splits (`leakage_deepplastic.csv`).
- **Remediation**: Re-grouped by original base image stem; all duplicated/augmented variants strictly isolated into train split. Zero test/val contamination.
