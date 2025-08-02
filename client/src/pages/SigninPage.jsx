import React, { useState } from 'react';
import AppLayout from '../components/AppLayout';
// import { useNavigate } from 'react-router-dom'; // NEW: You'll need this for redirection
// import { useAuth } from '../context/AuthContext'; // NEW: You'll need this to update auth state

export default function SigninPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember_me, setRememberMe] = useState(false); // NEW: State for remember me checkbox
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(''); // State to hold backend errors

  // const navigate = useNavigate(); // Hook for programmatic navigation
  // const { login } = useAuth(); // Get login function from AuthContext

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors on new submission

    // --- Start of Backend API Call Logic ---
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'X-CSRFToken': 'your-csrf-token-here', // You'll need to get and send the CSRF token
        },
        body: JSON.stringify({ email, password, remember_me }), // CHANGED: Include remember_me in the payload
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful:', data.message);
        // await login({ name: data.name, email: email });
        // navigate('/calendar');
      } else {
        const errorMessage = data.error || data.message || 'An unknown error occurred.';
        console.error('Login failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Network or unexpected error:', err);
      setError('Failed to connect to the server. Please try again.');
    }
    // --- End of Backend API Call Logic ---
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

          {/* NEW: Remember Me checkbox */}
          <div className="form-check mb-3"> {/* Added mb-3 for spacing */}
            <input
              className="form-check-input"
              type="checkbox"
              id="rememberMeCheckbox" // NEW: Unique ID for remember me checkbox
              checked={remember_me} // Controls checkbox state
              onChange={() => setRememberMe(!remember_me)} // Toggles state
            />
            <label className="form-check-label" htmlFor="rememberMeCheckbox">
              Remember Me {/* Label for the checkbox */}
            </label>
          </div>
          {/* END NEW */}

          <button type="submit" className="btn btn-secondary" id="submit_tab">
            Sign In
          </button>

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}