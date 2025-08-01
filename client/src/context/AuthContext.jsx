// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

// Create context
export const AuthContext = createContext();

// Create provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true); // Optional

  useEffect(() => {
    // Fetch user authentication status from Flask backend
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          credentials: 'include', // crucial to include session cookies!
        });
        const data = await response.json();

        if (data.isAuthenticated) {
          setCurrentUser({ name: data.name });
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

  // Optional: Logout function (can be used in Sidebar later)
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        inviteCount,
        setInviteCount,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
