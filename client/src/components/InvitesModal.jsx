// src/components/InvitesModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { useFlash } from '../context/FlashContext'; // Assuming you have this for flash messages

export default function InvitesModal({ show, onClose }) {
  const { addFlashMessage } = useFlash();

  // State for invites and loading
  const [loading, setLoading] = useState(false);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState(null);

  // State for description popup modal
  const [descModalShow, setDescModalShow] = useState(false);
  const [descTitle, setDescTitle] = useState('');
  const [descContent, setDescContent] = useState('');

  // Fetch invites when modal is opened
  useEffect(() => {
    if (!show) return;

    setLoading(true);
    setError(null);

    fetch('http://127.0.0.1:5000/api/notifications/check_invites', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to load invites');
        }
        return res.json();
      })
      .then((data) => {
        const combined = [
          ...(data.group_invites || []).map(inv => ({ ...inv, type: 'group' })),
          ...(data.event_invites || []).map(inv => ({ ...inv, type: 'event' })),
        ];
        setInvites(combined);
      })
      .catch((err) => {
        setError(err.message);
        addFlashMessage('danger', `Error loading invitations: ${err.message}`);
      })
      .finally(() => setLoading(false));
  }, [show, addFlashMessage]);

  // Helper: Remove invite from UI after accept/decline
  const removeInviteById = (id) => {
    setInvites((prev) => prev.filter((inv) => inv.id !== id));
  };

  // Accept or decline invite
  const respondToInvite = (id, type, status) => {
    fetch('http://127.0.0.1:5000/api/notifications/check_invites', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_id: id,
        invite_type: type,
        status: status,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to update invite');
        }
        return res.json();
      })
      .then(() => {
        removeInviteById(id);
        addFlashMessage(
          'success',
          status === 'Accepted' ? 'Invitation accepted successfully' : 'Invitation declined'
        );

        // Optional: here you can call your group/event refresh logic if you want,
        // for example:
        // if (type === 'group') refreshGroups();
        // else refreshCalendarEvents();
      })
      .catch((err) => {
        addFlashMessage('danger', `Error updating invitation: ${err.message}`);
      });
  };

  // Show description modal
  const openDescriptionModal = (title, description) => {
    setDescTitle(title);
    setDescContent(description);
    setDescModalShow(true);
  };

  // Render invite cards depending on type (group/event)
  const renderInvite = (invite) => {
    const descText = invite.description?.length
      ? invite.description.length > 50
        ? invite.description.substring(0, 50) + '...'
        : invite.description
      : 'No description';

    const descriptionClickable = (
      <small
        className="text-muted"
        style={{ cursor: 'pointer' }}
        onClick={() => openDescriptionModal(`${invite.name} Description`, invite.description || 'No description')}
        title="Click to view full description"
      >
        <i className="bi bi-info-circle me-1"></i>
        {descText}
      </small>
    );

    if (invite.type === 'group') {
      return (
        <div
          key={invite.id}
          className="list-group-item d-flex justify-content-between align-items-center py-2"
        >
          <div className="d-flex flex-column flex-grow-1 pe-3" style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center">
              <span className="badge bg-primary me-2">GROUP</span>
              <strong className="text-truncate">{invite.name}</strong>
            </div>
            <div className="d-flex mt-1">{descriptionClickable}</div>
          </div>
          <div className="d-flex flex-shrink-0 gap-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => respondToInvite(invite.id, 'group', 'Accepted')}
              title="Accept"
            >
              <i className="bx bx-check" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}></i>
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => respondToInvite(invite.id, 'group', 'Declined')}
              title="Decline"
            >
              <i className="bx bx-x" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}></i>
            </Button>
          </div>
        </div>
      );
    }

    // Event invite
    if (invite.type === 'event') {
      return (
        <div
          key={invite.id}
          className="list-group-item d-flex justify-content-between align-items-center py-2"
        >
          <div className="d-flex flex-column flex-grow-1 pe-3" style={{ minWidth: 0 }}>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <span className="badge bg-warning text-dark me-2">EVENT</span>
              <strong className="text-truncate">{invite.name}</strong>
              <span className="text-muted ms-2">
                <i className="bx bx-group"></i> {invite.group}
              </span>
            </div>
            <div className="d-flex mt-1">{descriptionClickable}</div>
            <div className="d-flex flex-wrap mt-1 gap-3 text-muted small">
              <div>
                <i className="bi bi-clock me-1"></i> {invite.start_time} - {invite.end_time}
              </div>
              <div>
                <i className="bi bi-person me-1"></i> {invite.creator}
              </div>
            </div>
          </div>
          <div className="d-flex flex-shrink-0 gap-2">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => respondToInvite(invite.id, 'event', 'Accepted')}
              title="Accept"
            >
              <i className="bx bx-check" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}></i>
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => respondToInvite(invite.id, 'event', 'Declined')}
              title="Decline"
            >
              <i className="bx bx-x" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}></i>
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Modal
        show={show}
        onHide={onClose}
        size="lg"
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Pending Invitations</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
              <p className="mb-0 mt-2">Loading invitations...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              Error loading invitations. Please try again later.
            </Alert>
          ) : invites.length === 0 ? (
            <p className="text-center py-4 text-muted">No pending invitations</p>
          ) : (
            <div className="list-group list-group-flush">
              {invites.map((invite) => renderInvite(invite))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Description Popup Modal */}
      <Modal
        show={descModalShow}
        onHide={() => setDescModalShow(false)}
        centered
        size="sm"
        aria-labelledby="descriptionPopupTitle"
      >
        <Modal.Header closeButton>
          <Modal.Title id="descriptionPopupTitle">{descTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}
        >
          {descContent || 'No description'}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setDescModalShow(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
