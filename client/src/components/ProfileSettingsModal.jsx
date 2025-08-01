// src/components/ProfileSettingsModal.jsx
import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export default function ProfileSettingsModal({ show, onClose }) {
  const [form, setForm] = useState({
    name: 'Meet Modi',
    email: 'hyenalaughs707@gmail.com',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // TODO: Submit logic
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Profile Settings</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <label className="fw-bold mb-1">Name</label>
        <input
          className="form-control mb-3"
          name="name"
          value={form.name}
          onChange={handleChange}
        />

        <label className="fw-bold mb-1">Email</label>
        <input
          className="form-control mb-3"
          name="email"
          value={form.email}
          onChange={handleChange}
        />

        <label className="fw-bold mb-1">Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          className="form-control mb-2"
          name="password"
          value={form.password}
          onChange={handleChange}
        />

        <div className="form-check mt-1">
          <input
            type="checkbox"
            className="form-check-input"
            id="showPassword"
            checked={showPassword}
            onChange={() => setShowPassword((prev) => !prev)}
          />
          <label className="form-check-label text-success" htmlFor="showPassword">
            Show Password
          </label>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Save Changes</Button>
      </Modal.Footer>
    </Modal>
  );
}
