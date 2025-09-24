import React, { useEffect } from "react";
import { useNotifications } from "../context/NotificationsContext";

export default function NotificationsList() {
  const {
    notifications,
    fetchNotifications,
    markNotificationAsRead,
  } = useNotifications();

  useEffect(() => {
    fetchNotifications();
  }, []);

  if (!notifications.length) {
    return (
      <div className="text-center py-3">
        <p>No unread notifications</p>
      </div>
    );
  }

  const handleClick = (id, type, read_status) => {
    if (read_status === "Read") return;
    markNotificationAsRead(id, type);
  };

  return (
    <div id="notificationList">
      {notifications.map((notification, idx) => {
        const isLast = idx === notifications.length - 1;
        const isUnread = notification.read_status !== "Read";

        return (
          <div
            key={notification.id}
            className={`notification-item ${isUnread ? "unread" : ""} ${
              isLast ? "last-notification" : ""
            }`}
            data-id={notification.id}
            data-type={notification.type}
            onClick={() =>
              handleClick(notification.id, notification.type, notification.read_status)
            }
            onMouseDown={(e) => e.preventDefault()} // disable text selection on double click
            style={{
              cursor: "pointer",
              backgroundColor: isUnread ? "#f0f8ff" : "transparent",
              padding: "10px",
              borderBottom: "1px solid #ddd",
            }}
          >
            <div className="notification-content">
              <p className="mb-0">
                You have been invited to {notification.type === "group" ? "group " : "event "}
                {notification.name}
              </p>
            </div>
            <div className="notification-footer">{notification.passed_time}</div>
          </div>
        );
      })}
    </div>
  );
}
