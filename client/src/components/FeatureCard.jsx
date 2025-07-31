// src/components/FeatureCard.jsx
import React from 'react';

export default function FeatureCard({ icon, title, description }) {
  return (
    <div className="card text-center shadow-sm h-100 d-flex flex-column">
      <div className="card-body d-flex flex-column justify-content-between">
        <div>
          <div className="mb-2" style={{ fontSize: '2rem' }}>{icon}</div>
          <h5 className="card-title">{title}</h5>
          <p className="card-text">{description}</p>
        </div>
      </div>
    </div>
  );
}
