import React from 'react';

export default function DeviceBar({ deviceInfo }) {
  if (!deviceInfo) return null;

  const { cuda_available, gpu_name, cudnn_version, torch_version, gpu_count } = deviceInfo;

  return (
    <div className="device-bar" id="device-bar">
      <span className="device-chip">
        <span className="icon">🔥</span>
        PyTorch {torch_version}
      </span>

      {cuda_available ? (
        <>
          <span className="device-chip gpu-active">
            <span className="icon">⚡</span>
            {gpu_name}
          </span>
          {cudnn_version && (
            <span className="device-chip gpu-active">
              <span className="icon">🧠</span>
              cuDNN v{cudnn_version}
            </span>
          )}
          <span className="device-chip gpu-active">
            <span className="icon">🎯</span>
            {gpu_count} GPU{gpu_count > 1 ? 's' : ''}
          </span>
        </>
      ) : (
        <span className="device-chip gpu-missing">
          <span className="icon">⚠️</span>
          No CUDA GPU detected
        </span>
      )}
    </div>
  );
}
