import React from 'react';

/* Inline SVG icons — thin-stroke geometric style */
const IconFlame = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c.5 3.5-1.5 6-1.5 6A5.5 5.5 0 0 0 16 14a4 4 0 0 1-4 4 4 4 0 0 1-4-4c0-2.5 1.5-4 2-5.5C10.5 7 9 5 12 2z"/>
  </svg>
);

const IconGpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="8" y="8" width="8" height="8" rx="1"/>
    <line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/>
    <line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/>
    <line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/>
  </svg>
);

const IconCuDNN = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
);

const IconChip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
    <path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>
  </svg>
);

const IconWarn = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

export default function DeviceBar({ deviceInfo }) {
  if (!deviceInfo) return null;

  const { cuda_available, gpu_name, cudnn_version, torch_version, gpu_count } = deviceInfo;

  return (
    <div className="device-bar" id="device-bar">
      <span className="device-chip">
        <IconFlame />
        PyTorch {torch_version}
      </span>

      {cuda_available ? (
        <>
          <span className="device-chip gpu-active">
            <IconGpu />
            {gpu_name}
          </span>
          {cudnn_version && (
            <span className="device-chip gpu-active">
              <IconCuDNN />
              cuDNN v{cudnn_version}
            </span>
          )}
          <span className="device-chip gpu-active">
            <IconChip />
            {gpu_count} GPU{gpu_count > 1 ? 's' : ''}
          </span>
        </>
      ) : (
        <span className="device-chip gpu-missing">
          <IconWarn />
          No CUDA GPU detected
        </span>
      )}
    </div>
  );
}
