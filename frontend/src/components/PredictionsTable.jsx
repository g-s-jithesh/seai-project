import React from 'react';

export default function PredictionsTable({ predictions, title }) {
  if (!predictions || predictions.length === 0) return null;

  return (
    <div className="predictions glass" id="predictions-table">
      <h3 className="predictions__title">{title || 'Top-5 Predictions'}</h3>
      {predictions.map((p, i) => (
        <div className="pred-row" key={i}>
          <span className="pred-row__rank">{i + 1}</span>
          <span className="pred-row__label">{p.label}</span>
          <div className="pred-row__bar">
            <div className="pred-row__bar-fill" style={{ width: `${p.confidence}%` }} />
          </div>
          <span className="pred-row__conf">{p.confidence}%</span>
        </div>
      ))}
    </div>
  );
}
