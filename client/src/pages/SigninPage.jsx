import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in with', { email, password });
    // Add fetch/axios call to backend here
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

          <button type="submit" className="btn btn-secondary" id="submit_tab">
            Sign In
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
