// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { clearAllCache } from "../slices/eventsSlice";
import { useDispatch } from "react-redux";
import { useFlash } from "./FlashContext"; // use global flash system

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inviteCount, setInviteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const { addFlashMessage } = useFlash(); //  comes from FlashContext

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
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
        console.error("Error fetching auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthStatus();
  }, []);

  // 🔒 Logout Function
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setCurrentUser(null);
      setIsAuthenticated(false);

      //  Clear Redux event cache
      dispatch(clearAllCache());

      addFlashMessage("success", "You have been logged out.");
    } catch (error) {
      console.error("Logout failed:", error);
      addFlashMessage("danger", "Logout failed. Try again.");
    }
  };

  const updateProfile = async ({ name, email, password }) => {
    try {
      const res = await fetch("/api/auth/user_profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setCurrentUser((prev) => ({ ...prev, name, email }));
        addFlashMessage("success", "Profile updated successfully.");
        return { success: true };
      } else {
        const error = await res.json();
        addFlashMessage("danger", error.error || "Update failed.");
        return { success: false, error: error.error || "Update failed" };
      }
    } catch (err) {
      addFlashMessage("danger", err.message);
      return { success: false, error: err.message };
    }
  };

  const login = (userData) => {
    setCurrentUser(userData);
    setIsAuthenticated(true);
    addFlashMessage("success", "Logged in successfully!");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
