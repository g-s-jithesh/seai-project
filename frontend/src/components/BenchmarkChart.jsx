import React from 'react';

export default function BenchmarkChart({ title, cpuMs, gpuMs, id }) {
  if (cpuMs == null) return null;

  const maxMs = Math.max(cpuMs, gpuMs ?? 0, 1);

  return (
    <div className="bar-chart glass" id={id}>
      <h3 className="bar-chart__title">{title}</h3>

      <div className="bar-row bar-row--cpu">
        <span className="bar-row__label">CPU</span>
        <div className="bar-row__track">
          <div
            className="bar-row__fill"
            style={{ width: `${(cpuMs / maxMs) * 100}%` }}
          >
            {cpuMs.toFixed(2)} ms
          </div>
        </div>
      </div>

      {gpuMs != null && (
        <div className="bar-row bar-row--gpu">
          <span className="bar-row__label">GPU</span>
          <div className="bar-row__track">
            <div
              className="bar-row__fill"
              style={{ width: `${(gpuMs / maxMs) * 100}%` }}
            >
              {gpuMs.toFixed(2)} ms
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
