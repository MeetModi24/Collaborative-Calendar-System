// src/components/InvitesModal.jsx
import React from 'react';

export default function InvitesModal({ show, onClose, invites = [] }) {
  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="modal-dialog" style={{ marginTop: '60px' }}>
        <div className="modal-content">

          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title">Pending Invitations</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {/* Body */}
          <div className="modal-body text-center py-4">
            {invites.length === 0 ? (
              <p className="text-muted">No pending invitations</p>
            ) : (
              invites.map((invite, index) => (
                <div key={index} className="mb-2">
                  <strong>{invite.groupName}</strong> - {invite.fromEmail}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer justify-content-center">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
