import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useFlash } from '../context/FlashContext'; // ✅ Import flash

export default function SignupPage() {
  const navigate = useNavigate();
  const { addFlashMessage } = useFlash(); // ✅ Initialize flash

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    const newErrors = {};
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;

    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    const password = formData.password;
    if (password.length < 8) newErrors.password = 'At least 8 characters';
    else if (!/\d/.test(password)) newErrors.password = 'Must include a digit';
    else if (!/[a-z]/.test(password)) newErrors.password = 'Must include a lowercase letter';
    else if (!/[A-Z]/.test(password)) newErrors.password = 'Must include an uppercase letter';
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) newErrors.password = 'Must include a special character';

    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        addFlashMessage('danger', 'Invalid server response.');
        return;
      }

      if (response.ok) {
        addFlashMessage('success', data.message || 'Signup successful!');
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });

        setTimeout(() => {
          navigate('/calendar');
        }, 1000);
      } else {
        addFlashMessage('danger', data.error || 'Signup failed.');
      }
    } catch {
      addFlashMessage('danger', 'An error occurred. Please try again.');
    }
  };

  return (
    <AppLayout>
      <div className="container mt-5" style={{ width: '70%' }}>
        <form onSubmit={handleSubmit} className="shadow p-3 mb-5 bg-body rounded">
          <legend>Sign Up</legend>

          <label className="form-label">Name</label>
          <input
            name="name"
            type="text"
            className="form-control"
            placeholder="Username"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <br />

          <label className="form-label">Email</label>
          <input
            name="email"
            type="email"
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            placeholder="someone@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          <br />

          <label className="form-label">Password</label>
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              onChange={() => setShowPassword(!showPassword)}
              id="togglePassword"
            />
            <label className="form-check-label text-success" htmlFor="togglePassword">
              Show Password
            </label>
          </div>
          <br />

          <label className="form-label">Confirm Password</label>
          <input
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              onChange={() => setShowConfirm(!showConfirm)}
              id="toggleConfirm"
            />
            <label className="form-check-label text-success" htmlFor="toggleConfirm">
              Show Confirm Password
            </label>
          </div>
          <br />

          <button type="submit" className="btn btn-secondary" id="submit_tab">
            Sign Up
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
