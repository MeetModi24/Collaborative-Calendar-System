// src/components/HeroSection.jsx
import React from 'react';

export default function HeroSection() {
  return (
    <div className="p-5 bg-light rounded mb-4 d-flex flex-wrap align-items-center justify-content-between">
      <div className="col-md-6 mb-3">
        <h2>Streamline Workflow with Shared Calendars</h2>
        <p className="lead">
          A unified space for teams to coordinate schedules, share events, and keep everything in sync.
        </p>
        <button className="btn btn-primary">Get Started →</button>
      </div>
      <div className="col-md-5 mb-3">
        <img
          src="/assets/cover-photo.jpeg"
          alt="cover"
          className="img-fluid rounded shadow"
        />
      </div>
    </div>
  );
}
