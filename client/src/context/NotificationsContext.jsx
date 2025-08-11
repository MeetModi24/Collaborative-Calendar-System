import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useFlash } from "./FlashContext";

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { addFlashMessage } = useFlash();

  const [inviteCount, setInviteCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Fetch pending invites count
  useEffect(() => {
    if (!isAuthenticated) {
      setInviteCount(0);
      return;
    }

    const fetchPendingInvitesCount = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/notifications/get_pending_invites_count", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch pending invites count");
        const count = await res.json();
        setInviteCount(count);
      } catch (err) {
        addFlashMessage("danger", "Error fetching pending invites count");
        console.error(err);
      }
    };

    fetchPendingInvitesCount();
  }, [isAuthenticated, addFlashMessage]);

  // Fetch unread notifications count
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotificationsCount(0);
      return;
    }

    const fetchUnreadNotificationsCount = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/notifications/get_unread_notifications_count", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch unread notifications count");
        const count = await res.json();
        setUnreadNotificationsCount(count);
      } catch (err) {
        addFlashMessage("danger", "Error fetching notifications count");
        console.error(err);
      }
    };

    fetchUnreadNotificationsCount();
  }, [isAuthenticated, addFlashMessage]);

  // Fetch notifications list
  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/notifications/get_notifications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();

      setNotifications(data);

      // Count unread
      const unreadCount = data.filter(n => n.read_status !== "Read").length;
      setUnreadNotificationsCount(unreadCount);
    } catch (err) {
      addFlashMessage("danger", "Error loading notifications. Please try again later.");
      console.error(err);
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = async (id, type) => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/notifications/get_notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, type }),
      });
      if (!res.ok) throw new Error("Failed to mark notification as read");

      // Update locally
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read_status: "Read" } : notif
        )
      );

      // Update unread count
      setUnreadNotificationsCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      addFlashMessage("danger", "Error marking notification as read");
      console.error(err);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        inviteCount,
        unreadNotificationsCount,
        notifications,
        fetchNotifications,
        markNotificationAsRead,
        setInviteCount,
        setUnreadNotificationsCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
