FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    TORCH_HOME=/app/.cache/torch \
    YOLO_CONFIG_DIR=/app/.cache/yolo \
    HF_HOME=/app/.cache/hf

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install CPU-only torch
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu || true

COPY . .

ENV PORT=8001
EXPOSE 8001

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
