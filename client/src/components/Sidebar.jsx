import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { useFlash } from "../context/FlashContext"; 
import { useNotifications } from "../context/NotificationsContext";

export default function Sidebar({
  collapsed,
  toggleSidebar,
  onCreateGroupClick,
  onProfileSettingsClick,
  onInvitesClick,
}) {
  const { currentUser, isAuthenticated, logout } = useContext(AuthContext);
  const { addFlashMessage } = useFlash(); 
  const { inviteCount } = useNotifications();


  const navItemClass =
    "sidebar-item d-flex align-items-center text-white px-3 py-2 text-decoration-none";

  return (
      <div
        className="bg-dark text-white d-flex flex-column justify-content-between"
        style={{
          width: collapsed ? "70px" : "240px",
          height: "100vh",
          transition: "width 0.3s ease",
        }}
      >
        <div>
          {/* Hamburger */}
          <div className="d-flex flex-column gap-2 mt-3">
            <div
              role="button"
              onClick={toggleSidebar}
              className={navItemClass}
              style={{ cursor: "pointer" }}
            >
              <FaBars className="me-2 fs-5" />
              {!collapsed && <span className="fw-bold">Workspace</span>}
            </div>
          </div>

          {/* Search */}
          {!collapsed && (
            <div className="px-3 mt-3 mb-2">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-secondary border-0 text-white">
                  <i className="bx bx-search" />
                </span>
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Search..."
                />
              </div>
            </div>
          )}

          {/* Nav Items */}
          <div className="d-flex flex-column gap-1 mt-2">
            <Link to="/calendar" className={navItemClass}>
              <i className="bx bx-calendar fs-5 me-2" />
              {!collapsed && <span>Calendar</span>}
            </Link>

            <button
              onClick={() => {
                if (isAuthenticated) {
                  onCreateGroupClick();
                } else {
                  addFlashMessage(
                    "danger",
                    "You must be logged in to create a group."
                  );
                }
              }}
              className={`${navItemClass} bg-transparent border-0 text-start w-100`}
            >
              <i className="bx bxs-user-plus fs-5 me-2" />
              {!collapsed && <span>Create Group</span>}
            </button>

            <button
              onClick={onInvitesClick}
              className={`${navItemClass} bg-transparent border-0 text-start w-100 position-relative`}
            >
              <i className="bx bx-envelope fs-5 me-2" />
              {!collapsed && <span>Invites</span>}

              {/* Invite badge */}
              {inviteCount > 0 && (
                <span
                  id="inviteBadge"
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "0.6rem" }}
                >
                  {inviteCount}
                </span>
              )}
            </button>

            <button
              onClick={onProfileSettingsClick}
              className={`${navItemClass} bg-transparent border-0 text-start w-100`}
            >
              <i className="bx bx-cog fs-5 me-2" />
              {!collapsed && <span>Settings</span>}
            </button>
          </div>
        </div>

        {/* Profile Info */}
        {isAuthenticated && (
          <div className="border-top mt-3 pt-3 px-3 mb-2">
            <div className="d-flex align-items-center justify-content-between">
              <i className="bx bx-user-circle fs-4" />
              {!collapsed && (
                <>
                  <span className="fw-semibold ms-2">
                    {currentUser?.name || "User"}
                  </span>
                  <button
                    className="btn text-white p-0 ms-auto"
                    title="Sign out"
                    onClick={logout}
                  >
                    <i className="bx bx-log-out fs-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
      </div>
    );
  }