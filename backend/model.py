"""
model.py — PyTorch ResNet-50 loading, CUDA configuration, and inference utilities.

This module encapsulates all model-related logic:
  • Loading a pre-trained ResNet-50 model.
  • Detecting CUDA/cuDNN availability.
  • Running inference on both CPU and GPU with precise timing.
  • Running synthetic tensor workloads to demonstrate raw compute speedup.
"""

import time
import io
from typing import Optional

import torch
import torchvision.models as models
import torchvision.transforms as transforms
from PIL import Image

# ---------------------------------------------------------------------------
# ImageNet class labels (top-level, abridged for display)
# We'll load the full 1000-class mapping at runtime from torchvision.
# ---------------------------------------------------------------------------
IMAGENET_LABELS: Optional[list[str]] = None


def _load_imagenet_labels() -> list[str]:
    """Load the ImageNet 1000-class labels from torchvision's built-in metadata."""
    global IMAGENET_LABELS
    if IMAGENET_LABELS is not None:
        return IMAGENET_LABELS
    try:
        from torchvision.models import ResNet50_Weights
        meta = ResNet50_Weights.IMAGENET1K_V2.meta
        IMAGENET_LABELS = meta["categories"]
    except Exception:
        # Fallback: return indices as strings
        IMAGENET_LABELS = [str(i) for i in range(1000)]
    return IMAGENET_LABELS


# ---------------------------------------------------------------------------
# Preprocessing pipeline (matches ImageNet expectations)
# ---------------------------------------------------------------------------
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


# ---------------------------------------------------------------------------
# Model cache — we keep one CPU and one GPU copy warm.
# ---------------------------------------------------------------------------
_model_cpu: Optional[torch.nn.Module] = None
_model_gpu: Optional[torch.nn.Module] = None


def get_device_info() -> dict:
    """Return a summary of available compute devices."""
    cuda_available = torch.cuda.is_available()
    info = {
        "cuda_available": cuda_available,
        "cudnn_available": torch.backends.cudnn.is_available() if cuda_available else False,
        "cudnn_version": torch.backends.cudnn.version() if cuda_available and torch.backends.cudnn.is_available() else None,
        "gpu_name": torch.cuda.get_device_name(0) if cuda_available else None,
        "gpu_count": torch.cuda.device_count() if cuda_available else 0,
        "torch_version": torch.__version__,
    }
    return info


def _load_model(device: str) -> torch.nn.Module:
    """Load ResNet-50 onto the given device and cache it."""
    global _model_cpu, _model_gpu

    if device == "cpu" and _model_cpu is not None:
        return _model_cpu
    if device == "cuda" and _model_gpu is not None:
        return _model_gpu

    try:
        from torchvision.models import ResNet50_Weights
        model = models.resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
    except Exception:
        model = models.resnet50(pretrained=True)

    model.eval()
    
    if device == "cuda":
        # Crucial for performance as mentioned in the paper: enables cuDNN auto-tuner
        torch.backends.cudnn.benchmark = True

    model = model.to(device)

    if device == "cpu":
        _model_cpu = model
    else:
        _model_gpu = model

    return model


def prepare_image(image_bytes: bytes) -> Image.Image:
    """Open raw bytes as a PIL Image in RGB mode."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return img


def _run_inference(model: torch.nn.Module, tensor: torch.Tensor, device: str, warmup: int = 3) -> tuple[float, float, list[dict]]:
    """
    Run inference and return (transfer_ms, execution_ms, top5_predictions).

    Includes warmup passes (especially important for GPU to fill caches/JIT).
    Uses CUDA events for GPU timing and perf_counter for CPU timing.
    """
    # 1. Measure Data Transfer Time (PCIe Bottleneck simulation)
    transfer_start = time.perf_counter()
    if device == "cuda":
        # Pin memory to ensure fast PCIe DMA transfer as outlined in Section 3.1.2
        tensor = tensor.pin_memory()
        tensor = tensor.to(device, non_blocking=True)
        torch.cuda.synchronize() # Wait for transfer to finish
    else:
        tensor = tensor.to(device)
    transfer_ms = (time.perf_counter() - transfer_start) * 1000.0

    # Warmup
    with torch.no_grad():
        for _ in range(warmup):
            model(tensor)

    # 2. Measure Execution Time
    if device == "cuda":
        torch.cuda.synchronize()
        start_event = torch.cuda.Event(enable_timing=True)
        end_event = torch.cuda.Event(enable_timing=True)
        start_event.record()
        with torch.no_grad():
            output = model(tensor)
        end_event.record()
        torch.cuda.synchronize()
        execution_ms = start_event.elapsed_time(end_event)
    else:
        start = time.perf_counter()
        with torch.no_grad():
            output = model(tensor)
        execution_ms = (time.perf_counter() - start) * 1000.0

    # Post-process
    probabilities = torch.nn.functional.softmax(output[0], dim=0)
    top5 = torch.topk(probabilities, 5)
    labels = _load_imagenet_labels()

    predictions = []
    for i in range(5):
        idx = top5.indices[i].item()
        predictions.append({
            "label": labels[idx] if idx < len(labels) else str(idx),
            "confidence": round(top5.values[i].item() * 100, 2),
        })

    return transfer_ms, execution_ms, predictions


def benchmark_image(image_bytes: bytes) -> dict:
    """
    Full benchmark pipeline:
      1. Load / prepare the image.
      2. Run ResNet-50 inference on CPU.
      3. Run ResNet-50 inference on GPU (if available).
      4. Run a synthetic matrix-multiplication workload on both.
      5. Return all metrics.
    """
    img = prepare_image(image_bytes)
    input_tensor = preprocess(img).unsqueeze(0)  # [1, 3, 224, 224]

    device_info = get_device_info()
    cuda_available = device_info["cuda_available"]

    # ---- ResNet-50 Inference ------------------------------------------------
    cpu_model = _load_model("cpu")
    cpu_transfer_ms, cpu_execution_ms, cpu_predictions = _run_inference(cpu_model, input_tensor, "cpu")

    gpu_execution_ms = None
    gpu_transfer_ms = None
    gpu_predictions = None
    if cuda_available:
        gpu_model = _load_model("cuda")
        gpu_transfer_ms, gpu_execution_ms, gpu_predictions = _run_inference(gpu_model, input_tensor, "cuda")

    # ---- Synthetic Tensor Workload ------------------------------------------
    matrix_size = 2048
    a_cpu = torch.randn(matrix_size, matrix_size)
    b_cpu = torch.randn(matrix_size, matrix_size)

    # CPU matmul
    start = time.perf_counter()
    _ = torch.mm(a_cpu, b_cpu)
    cpu_matmul_ms = (time.perf_counter() - start) * 1000.0

    gpu_matmul_ms = None
    if cuda_available:
        a_gpu = a_cpu.to("cuda")
        b_gpu = b_cpu.to("cuda")
        # Warmup
        for _ in range(3):
            torch.mm(a_gpu, b_gpu)
        torch.cuda.synchronize()
        start_event = torch.cuda.Event(enable_timing=True)
        end_event = torch.cuda.Event(enable_timing=True)
        start_event.record()
        _ = torch.mm(a_gpu, b_gpu)
        end_event.record()
        torch.cuda.synchronize()
        gpu_matmul_ms = start_event.elapsed_time(end_event)

    # ---- Build results dict -------------------------------------------------
    inference_speedup = round(cpu_execution_ms / gpu_execution_ms, 2) if gpu_execution_ms and gpu_execution_ms > 0 else None
    matmul_speedup = round(cpu_matmul_ms / gpu_matmul_ms, 2) if gpu_matmul_ms and gpu_matmul_ms > 0 else None

    return {
        "device_info": device_info,
        "inference": {
            "cpu": {
                "transfer_ms": round(cpu_transfer_ms, 3),
                "execution_ms": round(cpu_execution_ms, 3),
                "predictions": cpu_predictions,
            },
            "gpu": {
                "transfer_ms": round(gpu_transfer_ms, 3) if gpu_transfer_ms is not None else None,
                "execution_ms": round(gpu_execution_ms, 3) if gpu_execution_ms is not None else None,
                "predictions": gpu_predictions,
            } if cuda_available else None,
            "speedup": inference_speedup,
        },
        "matmul": {
            "matrix_size": matrix_size,
            "cpu_time_ms": round(cpu_matmul_ms, 3),
            "gpu_time_ms": round(gpu_matmul_ms, 3) if gpu_matmul_ms is not None else None,
            "speedup": matmul_speedup,
        },
    }
