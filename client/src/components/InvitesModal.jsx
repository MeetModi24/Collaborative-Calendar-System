// src/components/InvitesModal.jsx
import React from 'react';
import { getInitials, getAvatarColor } from '../utils/helpers';

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
          <div className="modal-body">
            {invites.length === 0 ? (
              <p className="text-muted text-center py-4">
                No pending invitations
              </p>
            ) : (
              invites.map((invite, index) => (
                <div
                  key={index}
                  className="d-flex align-items-center p-2 border-bottom"
                >
                  {/* Avatar */}
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: getAvatarColor(invite.fromName || invite.fromEmail),
                      fontSize: '14px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}
                  >
                    {getInitials(invite.fromName || invite.fromEmail)}
                  </div>

                  {/* Invitation Details */}
                  <div className="flex-grow-1">
                    <div className="fw-bold">{invite.groupName}</div>
                    <small className="text-muted">From: {invite.fromEmail}</small>
                  </div>
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
