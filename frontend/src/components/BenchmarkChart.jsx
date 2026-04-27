import React from 'react';

export default function BenchmarkChart({ title, cpuMs, gpuMs, cpuTransferMs, gpuTransferMs, id }) {
  if (cpuMs == null) return null;

  // Calculate total times for scaling
  const totalCpu = cpuMs + (cpuTransferMs || 0);
  const totalGpu = (gpuMs ?? 0) + (gpuTransferMs || 0);
  const maxMs = Math.max(totalCpu, totalGpu, 1);

  return (
    <div className="bar-chart glass" id={id}>
      <h3 className="bar-chart__title">{title}</h3>

      {/* CPU Row */}
      <div className="bar-row bar-row--cpu">
        <span className="bar-row__label">CPU</span>
        <div className="bar-row__track">
          {/* Transfer Time Bar */}
          {cpuTransferMs != null && (
             <div
               className="bar-row__fill"
               style={{ width: `${(cpuTransferMs / maxMs) * 100}%`, backgroundColor: 'rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.4)' }}
               title={`Transfer: ${cpuTransferMs.toFixed(2)}ms`}
             >
             </div>
          )}
          {/* Compute Time Bar */}
          <div
            className="bar-row__fill"
            style={{ width: `${(cpuMs / maxMs) * 100}%` }}
            title={`Compute: ${cpuMs.toFixed(2)}ms`}
          >
            {totalCpu.toFixed(2)} ms Total
          </div>
        </div>
      </div>

      {/* GPU Row */}
      {gpuMs != null && (
        <div className="bar-row bar-row--gpu">
          <span className="bar-row__label">GPU</span>
          <div className="bar-row__track">
             {/* Transfer Time Bar */}
            {gpuTransferMs != null && (
               <div
                 className="bar-row__fill"
                 style={{ width: `${(gpuTransferMs / maxMs) * 100}%`, backgroundColor: 'rgba(255,255,255,0.2)', borderRight: '1px solid rgba(255,255,255,0.4)' }}
                 title={`PCIe Transfer: ${gpuTransferMs.toFixed(2)}ms`}
               >
               </div>
            )}
            {/* Compute Time Bar */}
            <div
              className="bar-row__fill"
              style={{ width: `${(gpuMs / maxMs) * 100}%` }}
              title={`Compute: ${gpuMs.toFixed(2)}ms`}
            >
              {totalGpu.toFixed(2)} ms Total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
