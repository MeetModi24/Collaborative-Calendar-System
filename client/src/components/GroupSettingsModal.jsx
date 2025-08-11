import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import { useFlash } from '../context/FlashContext';

const roleOrder = { Admin: 1, Editor: 2, Viewer: 3 };
const roles = ['Admin', 'Editor', 'Viewer'];

export default function GroupSettingsModal({ show, onClose, groupId }) {
  const { addFlashMessage } = useFlash();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [currEmail, setCurrEmail] = useState(null);
  const [version, setVersion] = useState(null);

  const [originalData, setOriginalData] = useState({
    name: '',
    description: '',
    members: []
  });
  const [currentData, setCurrentData] = useState({
    name: '',
    description: '',
    members: []
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!show) return;
    if (!groupId || groupId === 1) {
        setError('Please select a valid group');
        return;
    }

    setLoading(true);
    setError(null);
    fetch(`http://127.0.0.1:5000/api/groups/group_info/${groupId}`, {
        credentials: 'include',  // <--- add this line
    })
        .then(async (res) => {
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Failed to fetch group data');
        }
        return res.json();
        })
        .then(data => {
        const sortedMembers = [...data.members].sort((a, b) => {
            if (data.authorization && a.email === data.curr_email) return -1;
            if (data.authorization && b.email === data.curr_email) return 1;
            return roleOrder[a.role] - roleOrder[b.role];
        });

        setOriginalData({
            name: data.name,
            description: data.description,
            members: sortedMembers
        });
        setCurrentData({
            name: data.name,
            description: data.description,
            members: sortedMembers.map(m => ({ ...m }))
        });
        setIsAdmin(data.authorization);
        setCurrEmail(data.curr_email);
        setVersion(data.version);
        })
        .catch(err => {
        setError(err.message);
        })
        .finally(() => setLoading(false));
    }, [groupId, show]);


  // Validate name & description (simple)
  const validate = () => {
    const errs = {};
    if (!currentData.name.trim()) errs.name = 'Group name is required';
    if (currentData.name.length > 100) errs.name = 'Group name max 100 characters';
    if (currentData.description.length > 500) errs.description = 'Description max 500 characters';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle input changes
  const onChangeField = (field, value) => {
    setCurrentData(prev => ({ ...prev, [field]: value }));
  };

  // Handle member role change
  const onChangeMemberRole = (email, newRole) => {
    setCurrentData(prev => ({
      ...prev,
      members: prev.members.map(m =>
        m.email === email ? { ...m, role: newRole } : m
      )
    }));
  };

  // Handle remove member (if allowed)
  const onRemoveMember = (email) => {
    setCurrentData(prev => ({
      ...prev,
      members: prev.members.filter(m => m.email !== email)
    }));
  };

  // Check if changes exist compared to originalData
  const hasChanges = () => {
    if (originalData.name !== currentData.name) return true;
    if (originalData.description !== currentData.description) return true;
    if (originalData.members.length !== currentData.members.length) return true;

    for (let i = 0; i < originalData.members.length; i++) {
      const origM = originalData.members[i];
      const currM = currentData.members.find(m => m.email === origM.email);
      if (!currM) return true;
      if (origM.role !== currM.role) return true;
    }
    return false;
  };

  // Save group changes
  const onSave = () => {
    if (!validate()) return;

    if (!hasChanges()) {
      addFlashMessage('info', 'No changes to save');
      return;
    }

    const payload = {
      name: currentData.name.trim(),
      description: currentData.description.trim(),
      members: currentData.members.map(m => ({ email: m.email, role: m.role })),
      version: version
    };

    setLoading(true);
    fetch(`http://127.0.0.1:5000/api/groups/group_info/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Failed to update group');
        }
        return res.json();
      })
      .then(() => {
        addFlashMessage('success', 'Group settings updated successfully');
        onClose();
      })
      .catch(err => {
        setError(err.message);
        addFlashMessage('danger', `Error updating group: ${err.message}`);
      })
      .finally(() => setLoading(false));
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={onClose} size="lg" centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Group Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" />
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && !error && (
          <>
            <Form.Group className="mb-3" controlId="groupName">
              <Form.Label>Group Name</Form.Label>
              <Form.Control
                type="text"
                value={currentData.name}
                isInvalid={!!validationErrors.name}
                disabled={!isAdmin}
                onChange={e => onChangeField('name', e.target.value)}
                maxLength={100}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.name}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="groupDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentData.description}
                isInvalid={!!validationErrors.description}
                disabled={!isAdmin}
                onChange={e => onChangeField('description', e.target.value)}
                maxLength={500}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.description}
              </Form.Control.Feedback>
            </Form.Group>

            <h5>Members</h5>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {currentData.members.length === 0 && <p>No members in this group</p>}
              {currentData.members.map(member => {
                const isCurrentUser = member.email === currEmail;
                return (
                  <div
                    key={member.email}
                    className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded"
                  >
                    <div>
                      <strong>{member.name || member.email}</strong>
                      <br />
                      <small className="text-muted">{member.email}</small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {isAdmin && !isCurrentUser ? (
                        <Form.Select
                          value={member.role}
                          onChange={e => onChangeMemberRole(member.email, e.target.value)}
                          style={{ minWidth: '120px' }}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </Form.Select>
                      ) : (
                        <span className="badge bg-secondary" style={{ minWidth: '120px' }}>
                          {member.role}
                        </span>
                      )}

                      {isAdmin && !isCurrentUser && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onRemoveMember(member.email)}
                          title="Remove member"
                        >
                          &times;
                        </Button>
                      )}
                      {isCurrentUser && <span className="text-primary fst-italic">You</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSave}
          disabled={loading || !isAdmin}
          title={isAdmin ? '' : 'Only admins can edit group settings'}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
