import React, { useState, useEffect, useCallback } from 'react';
import ImageUploader from './components/ImageUploader.jsx';
import DeviceBar from './components/DeviceBar.jsx';
import SpeedupHero from './components/SpeedupHero.jsx';
import BenchmarkChart from './components/BenchmarkChart.jsx';
import PredictionsTable from './components/PredictionsTable.jsx';

const API_BASE = '/api';

/* --- Inline SVG Icons --- */
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const IconLoader = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 0.7s linear infinite' }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const IconAlert = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

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
      .catch(() => {});
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
          <span className="indicator-dot"></span>
          CUDA / cuDNN Accelerated
        </div>
        <h1>DeepAccel</h1>
        <p className="hero__sub">
          Upload an image. Watch ResNet-50 classify it on CPU vs GPU in real-time.
          See the raw power of CUDA and cuDNN hardware acceleration.
        </p>
      </header>

      {/* Device Info */}
      <DeviceBar deviceInfo={deviceInfo} />

      {/* No-CUDA banner */}
      {deviceInfo && !cudaAvailable && (
        <div className="no-cuda-banner glass" id="no-cuda-banner">
          <div className="no-cuda-banner__icon">
            <IconWarning />
          </div>
          <div className="no-cuda-banner__title">No CUDA GPU Detected</div>
          <div className="no-cuda-banner__desc">
            The backend will run inference on CPU only. To see the full GPU comparison,
            ensure an NVIDIA GPU with CUDA and cuDNN is available.
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
        {loading ? (
          <><IconLoader /> Running Benchmark</>
        ) : (
          <><IconPlay /> Run Benchmark</>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="error-banner" id="error-banner" role="alert">
          <IconAlert />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="benchmark-progress" id="benchmark-progress">
          <div className="spinner" />
          <p className="benchmark-progress__label">Running inference on CPU and GPU</p>
          <p className="benchmark-progress__sublabel">
            ResNet-50 / 224x224 / ImageNet-1K / {cudaAvailable ? 'CUDA + cuDNN' : 'CPU only'}
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
            title="ResNet-50 Inference Latency (Compute + Transfer)"
            cpuMs={results.inference.cpu.execution_ms}
            gpuMs={results.inference.gpu?.execution_ms}
            cpuTransferMs={results.inference.cpu.transfer_ms}
            gpuTransferMs={results.inference.gpu?.transfer_ms}
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
                {results.inference.cpu.execution_ms.toFixed(2)}
                <span style={{ fontSize: '0.5em', opacity: 0.5 }}> ms</span>
              </div>
              <div className="metric-card__subtext" style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '5px'}}>
                Transfer: {results.inference.cpu.transfer_ms.toFixed(2)} ms
              </div>
            </div>

            {results.inference.gpu && (
              <div className="metric-card metric-card--gpu glass">
                <div className="metric-card__header">
                  <span className="indicator" />
                  GPU Inference (CUDA)
                </div>
                <div className="metric-card__time">
                  {results.inference.gpu.execution_ms.toFixed(2)}
                  <span style={{ fontSize: '0.5em', opacity: 0.5 }}> ms</span>
                </div>
                <div className="metric-card__subtext" style={{fontSize: '0.75rem', opacity: 0.7, marginTop: '5px'}}>
                  PCIe Transfer: {results.inference.gpu.transfer_ms.toFixed(2)} ms
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
              {results.matmul.matrix_size}x{results.matmul.matrix_size} matrix multiplication (FP32)
            </p>
          </div>

          <BenchmarkChart
            title={`${results.matmul.matrix_size}x${results.matmul.matrix_size} MatMul Latency`}
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
        DeepAccel &mdash; Built with{' '}
        <a href="https://pytorch.org" target="_blank" rel="noopener noreferrer">PyTorch</a>,{' '}
        <a href="https://developer.nvidia.com/cudnn" target="_blank" rel="noopener noreferrer">cuDNN</a> &{' '}
        <a href="https://react.dev" target="_blank" rel="noopener noreferrer">React</a>
      </footer>
    </div>
  );
}
