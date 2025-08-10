// ParticipantsList.jsx
import React from 'react';

export default function ParticipantsList({ event, permission }) {
  const participants = event.extendedProps?.participants || [];

  const renderParticipant = (participant) => {
    return (
      <div key={participant.id || participant.email} className="participant-item">
        {participant.name || participant.email}
      </div>
    );
  };

  const renderStatusSection = (title, list, className) => {
    if (!list || list.length === 0) return null;
    return (
      <div className={`status-section ${className}`} id={`ss${className}`}>
        <h6>{title} ({list.length})</h6>
        {list.map(renderParticipant)}
      </div>
    );
  };

  if (participants.length === 0) {
    return <p className="text-muted">No participants</p>;
  }

  return (
    <div id="participants-list">
      {renderStatusSection("Accepted", event.extendedProps?.accepted_participants, "accepted")}
      {renderStatusSection("Declined", event.extendedProps?.declined_participants, "declined")}
      {renderStatusSection("Pending", event.extendedProps?.pending_participants, "pending")}
    </div>
  );
}
