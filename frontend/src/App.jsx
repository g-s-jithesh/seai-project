import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader.jsx';
import DeviceBar from './components/DeviceBar.jsx';
import SpeedupHero from './components/SpeedupHero.jsx';
import BenchmarkChart from './components/BenchmarkChart.jsx';
import PredictionsTable from './components/PredictionsTable.jsx';

const API_BASE = '/api';

export default function App() {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Fetch device info on mount
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((data) => setDeviceInfo(data.device_info))
      .catch(() => {}); // backend may not be running yet
  }, []);

  const handleFileSelect = useCallback((file) => {
    setSelectedFile(file);
    setResults(null);
    setError(null);
  }, []);

  const runBenchmark = useCallback(async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`${API_BASE}/benchmark`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      // Update device info from results
      if (data.device_info) setDeviceInfo(data.device_info);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const cudaAvailable = deviceInfo?.cuda_available;

  return (
    <div className="app-container">
      {/* Hero */}
      <header className="hero" id="hero">
        <div className="hero__badge">
          <span className="dot"></span>
          CUDA &amp; cuDNN Accelerated
        </div>
        <h1>DeepAccel</h1>
        <p className="hero__sub">
          Upload an image. Watch ResNet-50 classify it on CPU vs GPU in real-time.
          See the raw power of CUDA &amp; cuDNN hardware acceleration.
        </p>
      </header>

      {/* Device Info */}
      <DeviceBar deviceInfo={deviceInfo} />

      {/* No-CUDA banner */}
      {deviceInfo && !cudaAvailable && (
        <div className="no-cuda-banner glass" id="no-cuda-banner">
          <div className="no-cuda-banner__icon">⚠️</div>
          <div className="no-cuda-banner__title">No CUDA GPU Detected</div>
          <div className="no-cuda-banner__desc">
            The backend will run inference on CPU only. To see the full GPU comparison,
            ensure an NVIDIA GPU with CUDA &amp; cuDNN is available.
          </div>
        </div>
      )}

      {/* Upload */}
      <ImageUploader onFileSelect={handleFileSelect} disabled={loading} />

      {/* Run Button */}
      <button
        className="btn btn--primary btn--full"
        onClick={runBenchmark}
        disabled={!selectedFile || loading}
        id="run-benchmark-btn"
      >
        {loading ? '⏳  Running Benchmark…' : '🚀  Run Benchmark'}
      </button>

      {/* Error */}
      {error && (
        <div className="error-banner" id="error-banner" role="alert">
          ❌&nbsp; {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="benchmark-progress" id="benchmark-progress">
          <div className="spinner" />
          <p className="benchmark-progress__label">Running inference on CPU &amp; GPU…</p>
          <p className="benchmark-progress__sublabel">
            ResNet-50 · 224×224 · ImageNet-1K · {cudaAvailable ? 'CUDA + cuDNN' : 'CPU only'}
          </p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="results-panel" id="results-panel">
          {/* Speedup */}
          {results.inference.speedup && (
            <SpeedupHero
              speedup={results.inference.speedup}
              label="ResNet-50 Inference Speedup"
            />
          )}

          {/* Inference Timing Chart */}
          <BenchmarkChart
            title="ResNet-50 Inference Latency"
            cpuMs={results.inference.cpu.time_ms}
            gpuMs={results.inference.gpu?.time_ms}
            id="chart-inference"
          />

          {/* Metric Cards */}
          <div className="metrics-grid">
            <div className="metric-card metric-card--cpu glass">
              <div className="metric-card__header">
                <span className="indicator" />
                CPU Inference
              </div>
              <div className="metric-card__time">
                {results.inference.cpu.time_ms.toFixed(2)}<span style={{ fontSize: '0.5em', opacity: 0.6 }}> ms</span>
              </div>
            </div>

            {results.inference.gpu && (
              <div className="metric-card metric-card--gpu glass">
                <div className="metric-card__header">
                  <span className="indicator" />
                  GPU Inference (CUDA)
                </div>
                <div className="metric-card__time">
                  {results.inference.gpu.time_ms.toFixed(2)}<span style={{ fontSize: '0.5em', opacity: 0.6 }}> ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Predictions */}
          <PredictionsTable
            predictions={results.inference.cpu.predictions}
            title="Top-5 Predictions (ResNet-50 / ImageNet)"
          />

          {/* Matrix Multiplication Benchmark */}
          <div className="matmul-section glass" id="matmul-section">
            <h3 className="matmul-section__title">Synthetic Tensor Workload</h3>
            <p className="matmul-section__desc">
              {results.matmul.matrix_size}×{results.matmul.matrix_size} matrix multiplication (FP32)
            </p>
          </div>

          <BenchmarkChart
            title={`${results.matmul.matrix_size}×${results.matmul.matrix_size} MatMul Latency`}
            cpuMs={results.matmul.cpu_time_ms}
            gpuMs={results.matmul.gpu_time_ms}
            id="chart-matmul"
          />

          {results.matmul.speedup && (
            <SpeedupHero
              speedup={results.matmul.speedup}
              label="Matrix Multiply Speedup"
            />
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="footer" id="footer">
        DeepAccel — Built with{' '}
        <a href="https://pytorch.org" target="_blank" rel="noopener noreferrer">PyTorch</a>,{' '}
        <a href="https://developer.nvidia.com/cudnn" target="_blank" rel="noopener noreferrer">cuDNN</a> &amp;{' '}
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">React</a>
      </footer>
    </div>
  );
}
