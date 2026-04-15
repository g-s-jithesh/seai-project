import React from 'react';

export default function SpeedupHero({ speedup, label }) {
  if (speedup == null) return null;

  return (
    <div className="speedup-hero glass" id="speedup-hero">
      <p className="speedup-hero__label">{label || 'Inference Speedup'}</p>
      <p className="speedup-hero__value">{speedup}x</p>
      <p className="speedup-hero__sub">GPU was {speedup}x faster than CPU</p>
    </div>
  );
}
