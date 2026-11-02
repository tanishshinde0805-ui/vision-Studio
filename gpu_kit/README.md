# Vision-Studio GPU Retraining Kit

This kit allows running the full 100-epoch, 640x640 resolution training on a free GPU (Google Colab, Kaggle, or cloud instance).

### Usage Instructions
1. Upload `datasets/` and `classes.json` to your GPU environment.
2. Run `pip install ultralytics torch torchvision`.
3. Execute `python gpu_kit/train_full_gpu.py`.
4. Download the generated `best.pt` or `best.onnx` into `vision-studio-final/models/`.
The registry will automatically detect and load the updated weights.
