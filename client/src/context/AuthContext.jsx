// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ Flash Messages State
  const [flashMessages, setFlashMessages] = useState([]);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include',
        });
        const data = await response.json();

        if (data.isAuthenticated) {
          setCurrentUser({ name: data.name, email: data.email });
          setIsAuthenticated(true);
        } else {
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error fetching auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthStatus();
  }, []);

  // 🔒 Logout Function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentUser(null);
      setIsAuthenticated(false);
      addFlashMessage('success', 'You have been logged out.');
    } catch (error) {
      console.error('Logout failed:', error);
      addFlashMessage('danger', 'Logout failed. Try again.');
    }
  };

  // 🛠 Profile Update Function
  const updateProfile = async ({ name, email, password }) => {
    try {
      const res = await fetch('/api/auth/user_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setCurrentUser((prev) => ({ ...prev, name, email }));
        addFlashMessage('success', 'Profile updated successfully.');
        return { success: true };
      } else {
        const error = await res.json();
        addFlashMessage('danger', error.error || 'Update failed.');
        return { success: false, error: error.error || 'Update failed' };
      }
    } catch (err) {
      addFlashMessage('danger', err.message);
      return { success: false, error: err.message };
    }
  };

  const login = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    addFlashMessage('success', 'Logged in successfully!');
  };

  // ✅ Global Flash Message Function
  const addFlashMessage = (type, message) => {
    const id = Date.now();
    setFlashMessages((prev) => [...prev, { id, type, message }]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setFlashMessages((prev) => prev.filter((msg) => msg.id !== id));
    }, 3000);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        inviteCount,
        setInviteCount,
        login,
        logout,
        updateProfile,
        loading,
        flashMessages,
        addFlashMessage, // ✅ make available globally
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
