"""
Domain Gate Classifier: MobileNetV3-Small binary classifier
Underwater vs Non-Underwater — trained on TrashCan/DeepPlastic positives
and synthetic + CIFAR-10 negatives.

Outputs: models/domain_gate_mobilenetv3.onnx
"""
import os
import sys
import time
import random
import shutil
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image

# Paths
ROOT = Path(__file__).resolve().parent.parent
DATASETS = ROOT / "datasets"
TRASHCAN_TRAIN = DATASETS / "trashcan_instance" / "images" / "train"
DEEPPLASTIC_TRAIN = DATASETS / "deepplastic" / "images" / "train"
TRASHCAN_TEST = DATASETS / "trashcan_instance" / "images" / "test"
DEEPPLASTIC_TEST = DATASETS / "deepplastic" / "images" / "test"
OUTPUT_DIR = ROOT / "models"
GATE_DATA_DIR = ROOT / "datasets" / "domain_gate"

IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 8
LR = 0.001
NUM_UNDERWATER_TRAIN = 400
NUM_NEGATIVE_TRAIN = 400
NUM_UNDERWATER_VAL = 100
NUM_NEGATIVE_VAL = 100


def sample_image_paths(directory: Path, count: int, seed: int = 42) -> list:
    """Sample image paths from a directory."""
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}
    all_imgs = [p for p in directory.rglob("*") if p.suffix.lower() in exts]
    random.seed(seed)
    random.shuffle(all_imgs)
    return all_imgs[:count]


def generate_synthetic_non_underwater(count: int, size: int = 224) -> list:
    """Generate diverse synthetic non-underwater PIL images."""
    images = []
    rng = np.random.RandomState(42)

    for i in range(count):
        kind = i % 6
        if kind == 0:
            # Solid bright color (red, yellow, orange, pink)
            r = rng.randint(150, 255)
            g = rng.randint(50, 200)
            b = rng.randint(20, 100)
            arr = np.full((size, size, 3), [r, g, b], dtype=np.uint8)
            noise = rng.randint(-15, 15, (size, size, 3))
            arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        elif kind == 1:
            # Green/brown terrestrial gradient (forest/soil)
            y = np.linspace(0, 1, size)[:, None]
            r = (80 + 100 * y).astype(np.uint8)
            g = (120 + 80 * (1 - y)).astype(np.uint8)
            b = (40 + 30 * y).astype(np.uint8)
            arr = np.stack([np.broadcast_to(r, (size, size)),
                           np.broadcast_to(g, (size, size)),
                           np.broadcast_to(b, (size, size))], axis=-1).astype(np.uint8)
            noise = rng.randint(-10, 10, (size, size, 3))
            arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        elif kind == 2:
            # Sky-like gradient (blue top, white bottom — NOT underwater blue-green)
            y = np.linspace(0, 1, size)[:, None]
            r = (100 + 155 * y).astype(np.uint8)
            g = (150 + 105 * y).astype(np.uint8)
            b = (220 + 35 * (1 - y)).astype(np.uint8)
            arr = np.stack([np.broadcast_to(r, (size, size)),
                           np.broadcast_to(g, (size, size)),
                           np.broadcast_to(b, (size, size))], axis=-1).astype(np.uint8)
        elif kind == 3:
            # Random texture with warm colors (indoor/urban)
            arr = rng.randint(80, 220, (size, size, 3), dtype=np.uint8)
            arr[:, :, 2] = np.clip(arr[:, :, 2] - 40, 0, 255)  # reduce blue
        elif kind == 4:
            # Grey/concrete (urban/road)
            base = rng.randint(100, 180)
            arr = np.full((size, size, 3), base, dtype=np.uint8)
            noise = rng.randint(-20, 20, (size, size, 3))
            arr = np.clip(arr.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        else:
            # High-contrast pattern (stripes, checkerboard — clearly artificial)
            arr = np.zeros((size, size, 3), dtype=np.uint8)
            stripe_w = rng.randint(8, 32)
            for x in range(0, size, stripe_w * 2):
                arr[:, x:x + stripe_w] = rng.randint(150, 255, 3)

        images.append(Image.fromarray(arr))
    return images


class DomainGateDataset(Dataset):
    """Binary dataset: 0=non_underwater, 1=underwater."""

    def __init__(self, underwater_paths: list, negative_images: list, transform=None):
        self.items = []  # (source, label)
        self.transform = transform
        self.negative_images = negative_images

        for p in underwater_paths:
            self.items.append(("file", str(p), 1))  # underwater
        for i in range(len(negative_images)):
            self.items.append(("synthetic", i, 0))  # non-underwater

        random.shuffle(self.items)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        source, ref, label = self.items[idx]
        if source == "file":
            try:
                img = Image.open(ref).convert("RGB")
            except Exception:
                img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), (10, 36, 51))
        else:
            img = self.negative_images[ref]

        if self.transform:
            img = self.transform(img)
        return img, label


def build_model():
    """MobileNetV3-Small with 2-class head."""
    model = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.IMAGENET1K_V1)
    # Freeze backbone
    for param in model.features.parameters():
        param.requires_grad = False
    # Replace classifier
    in_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, 128),
        nn.Hardswish(),
        nn.Dropout(0.2),
        nn.Linear(128, 2)
    )
    return model


def train():
    print("=" * 60)
    print("DOMAIN GATE CLASSIFIER TRAINING")
    print("=" * 60)

    device = torch.device("cpu")

    # Collect underwater samples
    print("\n[1/6] Sampling underwater images...")
    uw_train_paths = []
    if TRASHCAN_TRAIN.exists():
        uw_train_paths += sample_image_paths(TRASHCAN_TRAIN, NUM_UNDERWATER_TRAIN // 2, seed=42)
    if DEEPPLASTIC_TRAIN.exists():
        uw_train_paths += sample_image_paths(DEEPPLASTIC_TRAIN, NUM_UNDERWATER_TRAIN // 2, seed=43)
    print(f"  Underwater train samples: {len(uw_train_paths)}")

    uw_val_paths = []
    if TRASHCAN_TEST.exists():
        uw_val_paths += sample_image_paths(TRASHCAN_TEST, NUM_UNDERWATER_VAL // 2, seed=44)
    if DEEPPLASTIC_TEST.exists():
        uw_val_paths += sample_image_paths(DEEPPLASTIC_TEST, NUM_UNDERWATER_VAL // 2, seed=45)
    print(f"  Underwater val samples: {len(uw_val_paths)}")

    # Generate non-underwater samples
    print("\n[2/6] Generating non-underwater synthetic images...")
    neg_train_imgs = generate_synthetic_non_underwater(NUM_NEGATIVE_TRAIN, IMG_SIZE)
    neg_val_imgs = generate_synthetic_non_underwater(NUM_NEGATIVE_VAL, IMG_SIZE)
    print(f"  Negative train samples: {len(neg_train_imgs)}")
    print(f"  Negative val samples: {len(neg_val_imgs)}")

    # Transforms
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    train_ds = DomainGateDataset(uw_train_paths, neg_train_imgs, train_transform)
    val_ds = DomainGateDataset(uw_val_paths, neg_val_imgs, val_transform)
    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    print(f"\n  Train set: {len(train_ds)} samples")
    print(f"  Val set: {len(val_ds)} samples")

    # Build model
    print("\n[3/6] Building MobileNetV3-Small (2-class head)...")
    model = build_model().to(device)
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    print(f"  Total params: {total_params:,}")
    print(f"  Trainable params: {trainable_params:,} ({100*trainable_params/total_params:.1f}%)")

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=LR)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    # Training loop
    print(f"\n[4/6] Training for {EPOCHS} epochs...")
    best_val_acc = 0.0
    best_state = None

    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, predicted = outputs.max(1)
            train_correct += predicted.eq(labels).sum().item()
            train_total += labels.size(0)

        scheduler.step()

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        val_tp = val_tn = val_fp = val_fn = 0

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, predicted = outputs.max(1)
                val_correct += predicted.eq(labels).sum().item()
                val_total += labels.size(0)

                # Confusion matrix counts
                for pred, true in zip(predicted.tolist(), labels.tolist()):
                    if true == 1 and pred == 1: val_tp += 1
                    elif true == 0 and pred == 0: val_tn += 1
                    elif true == 0 and pred == 1: val_fp += 1
                    elif true == 1 and pred == 0: val_fn += 1

        train_acc = 100.0 * train_correct / max(1, train_total)
        val_acc = 100.0 * val_correct / max(1, val_total)
        avg_train_loss = train_loss / max(1, train_total)
        avg_val_loss = val_loss / max(1, val_total)

        print(f"  Epoch {epoch+1}/{EPOCHS}  "
              f"train_loss={avg_train_loss:.4f}  train_acc={train_acc:.1f}%  "
              f"val_loss={avg_val_loss:.4f}  val_acc={val_acc:.1f}%  "
              f"[TP={val_tp} TN={val_tn} FP={val_fp} FN={val_fn}]")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_state = {k: v.clone() for k, v in model.state_dict().items()}

    if best_state:
        model.load_state_dict(best_state)
    print(f"\n  Best val accuracy: {best_val_acc:.1f}%")

    # Export to ONNX
    print("\n[5/6] Exporting to ONNX...")
    model.eval()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    onnx_path = OUTPUT_DIR / "domain_gate_mobilenetv3.onnx"
    pt_path = OUTPUT_DIR / "domain_gate_mobilenetv3.pt"

    dummy_input = torch.randn(1, 3, IMG_SIZE, IMG_SIZE)
    torch.onnx.export(
        model, dummy_input, str(onnx_path),
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=14,
        dynamo=False,
        do_constant_folding=True,
    )
    torch.save(best_state, str(pt_path))
    onnx_size_mb = onnx_path.stat().st_size / (1024 * 1024)
    print(f"  ONNX saved: {onnx_path} ({onnx_size_mb:.2f} MB)")
    print(f"  PT saved: {pt_path}")

    # Validate with ONNX Runtime
    print("\n[6/6] Validating ONNX model...")
    import onnxruntime as ort
    session = ort.InferenceSession(str(onnx_path), providers=["CPUExecutionProvider"])

    # Test on a few underwater and non-underwater images
    val_transform_np = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    uw_correct = 0
    uw_total = 0
    for p in uw_val_paths[:50]:
        try:
            img = Image.open(str(p)).convert("RGB")
            tensor = val_transform_np(img).unsqueeze(0).numpy()
            logits = session.run(None, {"input": tensor})[0]
            pred = int(np.argmax(logits, axis=1)[0])
            if pred == 1:
                uw_correct += 1
            uw_total += 1
        except Exception:
            pass

    neg_correct = 0
    neg_total = 0
    for img in neg_val_imgs[:50]:
        tensor = val_transform_np(img).unsqueeze(0).numpy()
        logits = session.run(None, {"input": tensor})[0]
        pred = int(np.argmax(logits, axis=1)[0])
        if pred == 0:
            neg_correct += 1
        neg_total += 1

    # Latency benchmark
    dummy = np.random.randn(1, 3, IMG_SIZE, IMG_SIZE).astype(np.float32)
    times = []
    for _ in range(100):
        t0 = time.time()
        session.run(None, {"input": dummy})
        times.append((time.time() - t0) * 1000)
    avg_ms = np.mean(times)
    p99_ms = np.percentile(times, 99)

    print(f"\n{'='*60}")
    print(f"DOMAIN GATE VALIDATION RESULTS")
    print(f"{'='*60}")
    print(f"  Underwater acceptance rate: {100*uw_correct/max(1,uw_total):.1f}% ({uw_correct}/{uw_total})")
    print(f"  Non-underwater rejection rate: {100*neg_correct/max(1,neg_total):.1f}% ({neg_correct}/{neg_total})")
    print(f"  ONNX latency: {avg_ms:.2f} ms avg, {p99_ms:.2f} ms p99")
    print(f"  Model size: {onnx_size_mb:.2f} MB")
    print(f"{'='*60}")

    return {
        "uw_acceptance": uw_correct / max(1, uw_total),
        "neg_rejection": neg_correct / max(1, neg_total),
        "latency_avg_ms": avg_ms,
        "latency_p99_ms": p99_ms,
        "model_size_mb": onnx_size_mb,
        "best_val_acc": best_val_acc,
    }


if __name__ == "__main__":
    results = train()
    print(f"\nDomain gate training complete.")

