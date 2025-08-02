import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) return null; // or a spinner

  return isAuthenticated ? children : <Navigate to="/signin" />;
};

export default ProtectedRoute;
