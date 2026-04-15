"""
main.py — FastAPI application for DeepAccel: CUDA & cuDNN Benchmark Service.

Endpoints:
  GET  /api/health      — Health check + device info.
  POST /api/benchmark   — Accept an image upload, run CPU vs GPU benchmarks.
"""

import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from model import get_device_info, benchmark_image

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s")
logger = logging.getLogger("deepaccel")

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="DeepAccel API",
    description="CUDA & cuDNN Deep Learning Workload Accelerator — Benchmark Service",
    version="1.0.0",
)

# CORS — allow the Vite dev server and common origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    info = get_device_info()
    logger.info("=" * 60)
    logger.info("DeepAccel Backend Starting")
    logger.info(f"  PyTorch        : {info['torch_version']}")
    logger.info(f"  CUDA available : {info['cuda_available']}")
    if info["cuda_available"]:
        logger.info(f"  GPU            : {info['gpu_name']}")
        logger.info(f"  cuDNN          : v{info['cudnn_version']}")
    else:
        logger.warning("  ⚠  No CUDA GPU detected — GPU benchmarks will be skipped.")
    logger.info("=" * 60)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health():
    """Return service health + device capabilities."""
    return {"status": "ok", "device_info": get_device_info()}


ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@app.post("/api/benchmark")
async def benchmark(file: UploadFile = File(...)):
    """
    Accept an uploaded image, run ResNet-50 inference on CPU (and GPU if
    available), plus a synthetic matrix-multiplication workload.
    Returns classification results and timing comparisons.
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type '{file.content_type}'. Allowed: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20 MB limit.")

    logger.info(f"Benchmark request — file={file.filename}  size={len(image_bytes)} bytes")

    try:
        results = benchmark_image(image_bytes)
    except Exception as exc:
        logger.exception("Benchmark failed")
        raise HTTPException(status_code=500, detail=str(exc))

    return results
