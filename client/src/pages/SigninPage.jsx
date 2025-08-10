import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFlash } from '../context/FlashContext'; // ✅ new import

export default function SigninPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addFlashMessage } = useFlash(); // ✅ use flash messages

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember_me, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:5000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me }),
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        await login({ name: data.user.name, email: data.user.email });
        addFlashMessage('success', 'Signed in successfully!'); // ✅ success flash
        navigate('/calendar');
      } else {
        const errorMessage = data.error || data.message || 'Sign in failed.';
        addFlashMessage('danger', errorMessage); // ✅ error flash
      }
    } catch (err) {
      addFlashMessage('danger', 'Failed to connect to the server. Please try again.');
    }
  };

  return (
    <AppLayout>
      <div className="container mt-5" style={{ width: '70%' }}>
        <form onSubmit={handleSubmit} className="shadow p-3 mb-5 bg-body rounded">
          <legend>Sign In</legend>

          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            placeholder="someone@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />

          <label className="form-label">Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            id="password"
            required
          />
          <br />

          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id="togglePassword"
              onChange={() => setShowPassword(!showPassword)}
            />
            <label className="form-check-label text-success" htmlFor="togglePassword">
              Show Password
            </label>
          </div>
          <br />

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="rememberMeCheckbox"
              checked={remember_me}
              onChange={() => setRememberMe(!remember_me)}
            />
            <label className="form-check-label" htmlFor="rememberMeCheckbox">
              Remember Me
            </label>
          </div>

          <button type="submit" className="btn btn-secondary" id="submit_tab">
            Sign In
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
