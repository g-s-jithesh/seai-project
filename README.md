# DeepAccel: CUDA & cuDNN Deep Learning Workload Accelerator

DeepAccel is a full-stack web application designed to practically demonstrate the acceleration of deep learning workloads using NVIDIA's CUDA and cuDNN technologies. 

It allows users to upload an image and run heavy inference tasks (like ResNet-50 image classification and raw tensor operations) simultaneously on the CPU and the CUDA-enabled GPU. The application visually logs and graphs the execution time differences, clearly showcasing the real-world hardware acceleration of modern deep learning workflows.

---

## 🚀 The Approach

We built this project to be an intermediate-level demonstration of hardware acceleration. The architecture is split into a high-performance backend that handles the heavy lifting with PyTorch, and a sleek, modern frontend that visualizes the results.

1.  **Backend Heavy Lifting (FastAPI + PyTorch):** We chose FastAPI for its speed and asynchronous capabilities. It exposes endpoints to receive images, preprocesses them using standard ImageNet pipelines, and feeds them into pre-trained ResNet-50 models.
2.  **Dual Execution Strategy:** Instead of just running on the GPU, we explicitly execute the workload on both the CPU and the GPU side-by-side. This provides a direct, tangible comparison of latency and throughput.
3.  **Accurate Profiling:** We use precise profiling techniques. For the CPU, we use `time.perf_counter()`. For the GPU, we use `torch.cuda.Event` with carefully managed `torch.cuda.synchronize()` calls to ensure we are measuring raw compute time without asynchronous overhead skewing the results.
4.  **Kinetic Monolith UI:** The frontend is built with React and Vite. It utilizes a custom "Kinetic Monolith" design system—a premium, high-performance aesthetic featuring glassmorphism, obsidian tones, and smooth micro-animations. It visually communicates "speed" and "processing power" without relying on generic placeholders or emojis.

---

## 🧠 Backend Deep Dive

The backend (`/backend`) is where the actual computation happens. 

### Core Components (`main.py` & `model.py`)

*   **`main.py`**: The entry point. It sets up the FastAPI application, configures CORS, handles startup events (logging device capabilities), and defines the REST API endpoints (`/api/health` and `/api/benchmark`).
*   **`model.py`**: The core logic module. This encapsulates all interaction with PyTorch.

### The Pipeline (`POST /api/benchmark`)

When an image is uploaded to the `/api/benchmark` endpoint, the following sequence occurs within `model.py`:

1.  **Preparation (`prepare_image`):** the raw bytes are opened as a PIL Image and converted strictly to RGB.
2.  **Preprocessing (`preprocess`):** The image undergoes standard ImageNet transformations: resizing to 256px, center cropping to 224x224, conversion to a PyTorch Tensor (0.0-1.0 range), and normalization using ImageNet mean/standard deviation. Result: a `[1, 3, 224, 224]` tensor.
3.  **Model Loading & Caching (`_load_model`):** We load a pre-trained ResNet-50 model. Crucially, we load one copy onto the CPU and one copy onto the CUDA device (if available) and **cache** them in memory. This prevents model loading time from skewing the benchmark results on subsequent runs.
4.  **CPU Inference (`_run_inference`):** 
    *   **Warmup:** The model runs a few "dummy" passes (warmup). This is vital to ensure caches are hot and any Just-In-Time (JIT) compilation is complete before timing begins.
    *   **Timing:** Execution is measured strictly using `time.perf_counter()`.
    *   **Post-processing:** The raw output logits are passed through a softmax function, and the top 5 predictions are mapped to their human-readable ImageNet class labels.
5.  **GPU Inference (`_run_inference`):**
    *   If CUDA is detected, the same process occurs on the GPU copy of the model.
    *   **Timing:** We use `torch.cuda.Event(enable_timing=True)`. Because GPU execution is asynchronous, we must call `torch.cuda.synchronize()` before starting and stopping the timer to ensure we capture the actual compute time on the hardware timeline.
6.  **Synthetic Tensor Workload (MatMul):** To show bare-metal compute acceleration absent of model overhead, we perform a massive matrix multiplication ($2048 \times 2048$ floating-point matrices) on both the CPU and GPU, profiling them independently.
7.  **Speedup Calculation:** The backend calculates the final speedup multiplier (e.g., $15.2\times$) and returns all data (predictions, ms latencies, device info) to the frontend.

---

## 🛠️ Project Structure

```text
/
├── backend/                  # FastAPI & PyTorch
│   ├── main.py               # API endpoints
│   ├── model.py              # PyTorch inference, CUDA timing, modeling
│   └── requirements.txt      # Python dependencies
│
└── frontend/                 # React & Vite UI
    ├── src/
    │   ├── components/       # UI Components (Uploader, Charts, Cards)
    │   ├── App.jsx           # Main application layout & state
    │   ├── index.css         # Kinetic Monolith Design System
    │   └── main.jsx          # React DOM entry
    ├── package.json          # Node dependencies
    └── vite.config.js        # Vite config (includes API proxy)
```

---

## ⚙️ Running Locally

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   An NVIDIA GPU (Optional, but required to see CUDA acceleration)
*   NVIDIA Drivers, CUDA Toolkit, and cuDNN installed.

### 1. Start the Backend
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies. **Crucially**, ensure you install the CUDA-enabled version of PyTorch if you have an NVIDIA GPU.
   ```bash
   # Example for CUDA 12.8 support on Windows (force reinstall if standard CPU pytorch is present)
   pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128 --force-reinstall
   
   # For standard dependencies:
   pip install -r requirements.txt
   ```
3. Run the development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

### 2. Start the Frontend
1. Open a new terminal and navigate to the `frontend` directory: `cd frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`. The backend runs on `localhost:8000`, and Vite automatically proxies `/api` requests to it.
