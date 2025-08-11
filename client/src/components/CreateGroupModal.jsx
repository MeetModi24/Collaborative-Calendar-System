import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useFlash } from "../context/FlashContext";

export default function ProfileSettingsModal({ show, onClose }) {
  const { addFlashMessage } = useFlash();

  // Form state
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // Validation errors state
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Validation functions (same as your original code)
  const validateName = (name) => {
    if (!name.trim()) return "Username cannot be empty";
    return "";
  };

  const validateEmail = (email) => {
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(email.trim())) return "Invalid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return ""; // password optional
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/\d/.test(password)) return "Password must have at least one digit";
    if (!/[a-z]/.test(password))
      return "Password must have at least one lowercase character";
    if (!/[A-Z]/.test(password))
      return "Password must have at least one uppercase character";
    if (!/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(password))
      return "Password must have at least one special character";
    return "";
  };

  // Fetch user profile from Flask backend on modal open
  useEffect(() => {
    if (show) {
      setLoading(true);
      fetch("http://127.0.0.1:5000/api/auth/user_profile", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      })
        .then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || "Failed to fetch user profile");
          }
          return res.json();
        })
        .then((data) => {
          setForm({
            name: data.name || "",
            email: data.email || "",
            password: "",
          });
          setErrors({ name: "", email: "", password: "" });
        })
        .catch((err) => {
          addFlashMessage("danger", "Error fetching profile: " + err.message);
          onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [show, addFlashMessage, onClose]);

  // Handle form field changes & validations
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));

    // validate each field live
    if (name === "name") setErrors((prev) => ({ ...prev, name: validateName(value) }));
    else if (name === "email") setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    else if (name === "password")
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
  };

  // Validate all fields before submission
  const validateAll = () => {
    const nameError = validateName(form.name);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    setErrors({ name: nameError, email: emailError, password: passwordError });

    return !nameError && !emailError && !passwordError;
  };

  // Submit updated profile to Flask backend POST /user_profile
  const handleSubmit = () => {
    if (!validateAll()) return;

    setSubmitting(true);

    fetch("http://127.0.0.1:5000/api/auth/user_profile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to update profile");
        }
        return res.json();
      })
      .then((data) => {
        addFlashMessage("success", "Profile updated successfully.");
        onClose();
        // Clear password field after successful update
        setForm((prev) => ({ ...prev, password: "" }));
        setErrors((prev) => ({ ...prev, password: "" }));
        setShowPassword(false);
      })
      .catch((err) => {
        addFlashMessage("danger", "Error updating profile: " + err.message);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  if (!show) return null;

  return (
    <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={!submitting}>
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>Profile Settings</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div>Loading profile...</div>
        ) : (
          <>
            <label htmlFor="nameInput" className="fw-bold mb-1">
              Name
            </label>
            <input
              id="nameInput"
              name="name"
              className={`form-control mb-3 ${errors.name ? "is-invalid" : ""}`}
              value={form.name}
              onChange={handleChange}
              disabled={submitting}
              autoFocus
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}

            <label htmlFor="emailInput" className="fw-bold mb-1">
              Email
            </label>
            <input
              id="emailInput"
              name="email"
              type="email"
              className={`form-control mb-3 ${errors.email ? "is-invalid" : ""}`}
              value={form.email}
              onChange={handleChange}
              disabled={submitting}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}

            <label htmlFor="passwordInput" className="fw-bold mb-1">
              Password
            </label>
            <input
              id="passwordInput"
              name="password"
              type={showPassword ? "text" : "password"}
              className={`form-control mb-2 ${errors.password ? "is-invalid" : ""}`}
              value={form.password}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Enter new password or leave blank"
              autoComplete="new-password"
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}

            <div className="form-check mt-1">
              <input
                id="showPasswordToggle"
                type="checkbox"
                className="form-check-input"
                checked={showPassword}
                onChange={() => setShowPassword((prev) => !prev)}
                disabled={submitting}
              />
              <label className="form-check-label text-success" htmlFor="showPasswordToggle">
                Show Password
              </label>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting || loading}>
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
