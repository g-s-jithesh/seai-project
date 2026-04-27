# DeepAccel: Viva & Oral Defense Cheat Sheet

This document is designed to help you confidently answer questions from your professor during your Viva. The answers are written in a humanized, technically accurate tone that perfectly matches the claims made in your IEEE research paper.

## Core Questions & Answers

### 1. "What exactly is this project and what problem does it solve?"
**Your Answer:** 
> "DeepAccel is a full-stack visual benchmarking tool. Usually, measuring how fast a GPU runs deep learning models requires complex, hard-to-read command-line scripts. I built a web application with an asynchronous FastAPI backend and a React frontend. It allows a user to upload an image and instantly see a side-by-side visual comparison of the inference latency on a CPU versus an NVIDIA GPU using cuDNN."

### 2. "You used DeepCuts as your base reference paper. What did you do differently or better?"
**Your Answer:** 
> "DeepCuts focuses on *generating* optimized C++ kernels deep in the backend. I realized that the real problem for most engineers isn't squeezing out 1% more speed, but rather **accessibility and diagnostics**. Instead of building a compiler, I built an interactive diagnostic dashboard. My tool makes the acceleration visible and easy to understand for testing local hardware health. I focused on the User Experience (UX) of hardware profiling."

### 3. "How did you accurately measure the GPU speed? Did you just use standard timers?" *(Crucial Question!)*
**Your Answer:** 
> "No, I couldn't just use standard Python timers like `time.time()`. GPU calls in PyTorch are asynchronous—the CPU just sends the command and moves on immediately. If I used regular timers, it would show 0.001 seconds, which is wrong. Instead, I explicitly used **`torch.cuda.Event`** markers with **`torch.cuda.synchronize()`** to force the CPU to wait. This allowed me to accurately measure the microsecond it took the GPU to actually finish the math."

### 4. "What is the 'PCIe Bottleneck' you mentioned in your paper?"
**Your Answer:** 
> "The GPU is incredibly fast at math, but sending the image data from the computer's RAM to the GPU's VRAM over the motherboard's PCIe bus is comparatively slow. In my backend code, I specifically used **`tensor.pin_memory()`** to speed up this transfer. More importantly, I explicitly separated the 'Transfer Time' from the 'Compute Time' in the code so the user can see exactly where the delay is happening, which is a nuance that tools like DeepCuts often gloss over."

### 5. "Why did you use ResNet-50 for the evaluation?"
**Your Answer:**
> "I chose ResNet-50 because it has over 25 million parameters and requires about 3.8 billion floating-point operations (FLOPs) per image. Lighter models don't provide enough workload to fully saturate a modern GPU's cores. ResNet-50 provides the mathematical density required to clearly show the stark contrast between CPU sequential processing and GPU parallel processing."

---

## Key Vocabulary to Drop During the Viva
If you use these words naturally, it proves you understand the deep technical architecture:
*   **"Asynchronous Kernel Dispatch"**: Why you couldn't use normal timers.
*   **"cuDNN Auto-Tuning Heuristics"**: Why you used `cudnn.benchmark = True` in your code (it finds the fastest convolution algorithm during a warm-up phase).
*   **"Page-Locked / Pinned Memory"**: How you sped up the PCIe data transfer.
*   **"Decoupled Architecture"**: Why you separated the Python backend from the React frontend (so the heavy math doesn't freeze the user interface).
