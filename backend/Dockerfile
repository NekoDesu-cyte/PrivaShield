# ── Blurify AI backend — Cloud Run container ──────────────────────────────────
FROM python:3.11-slim

# System libs needed by OpenCV (headless) and PyTorch runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        libglib2.0-0 \
        libgomp1 \
        && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    # HuggingFace + EasyOCR cache locations (baked into the image below)
    HF_HOME=/opt/models/hf \
    EASYOCR_MODULE_PATH=/opt/models/easyocr \
    PYTHONPATH=/app/backend

WORKDIR /app/backend

# Install CPU-only PyTorch first (much smaller than the default CUDA build),
# then the remaining dependencies.
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install -r requirements.txt

# Pre-download AI models at build time so there are no downloads at cold start.
RUN python -c "import easyocr; easyocr.Reader(['id','en'], gpu=False)" && \
    python -c "from transformers import pipeline; \
pipeline('ner', model='cahya/bert-base-indonesian-ner', aggregation_strategy='simple')"

# Application code
COPY . /app/backend

# Writable temp dir for uploads — '../uploads' (relative to WORKDIR) resolves here
RUN mkdir -p /app/uploads

# Cloud Run sets $PORT (default 8080). Bind to it; no --reload in production.
ENV PORT=8080
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
