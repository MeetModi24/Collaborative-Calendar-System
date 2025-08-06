import React, { useState, useContext, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProfileSettingsModal({ show, onClose, addFlashMessage }) {
  const { currentUser, isAuthenticated, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // Redirect if modal is opened by unauthenticated user
  useEffect(() => {
    if (show && !isAuthenticated) {
      onClose();
      navigate('/signin');
    }
  }, [isAuthenticated, show, navigate, onClose]);

  // Populate form with current user data when modal opens
  useEffect(() => {
    if (currentUser) {
      setForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: '',
      });
    }
  }, [currentUser, show]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      addFlashMessage("danger", "All fields are required.");
      return;
    }

    const res = await updateProfile({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (res.success) {
      addFlashMessage("success", "Profile updated successfully.");
      onClose();
    } else {
      addFlashMessage("danger", res.error || "Failed to update profile.");
    }
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
