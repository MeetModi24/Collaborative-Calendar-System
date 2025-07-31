// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ width = 250 }) {
  // 🔐 Later, replace with real authentication check
  const isAuthenticated = true;
  const currentUser = { name: 'John Doe' };

  return (
    <div
      className="bg-dark text-white d-flex flex-column justify-content-between p-3"
      style={{ width: `${width}px`, minHeight: '100vh' }}
    >
      {/* 🧩 Top Section */}
      <div>
        {/* 🔷 Logo */}
        <div className="d-flex align-items-center mb-4 ps-1">
          <i className="bx bxs-dashboard fs-4 me-2"></i>
          <h5 className="mb-0 fw-bold">Workspace</h5>
        </div>

        {/* 🔍 Search Bar */}
        <div className="mb-4">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-secondary border-0 text-white">
              <i className="bx bx-search"></i>
            </span>
            <input
              type="text"
              className="form-control bg-secondary text-white border-0"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* 📚 Navigation */}
        <ul className="nav flex-column gap-2">
          <li>
            <Link to="/calendar" className="nav-link text-white px-0 d-flex align-items-center">
              <i className="bx bx-calendar fs-5 me-2"></i>
              <span>Calendar</span>
            </Link>
          </li>

          <li>
            {isAuthenticated ? (
              <button className="btn btn-link text-white px-0 d-flex align-items-center text-decoration-none">
                <i className="bx bxs-user-plus fs-5 me-2"></i>
                <span>Create Group</span>
              </button>
            ) : (
              <Link to="/create-group" className="nav-link text-white px-0 d-flex align-items-center">
                <i className="bx bxs-user-plus fs-5 me-2"></i>
                <span>Create Group</span>
              </Link>
            )}
          </li>

          <li>
            {isAuthenticated ? (
              <button className="btn btn-link text-white px-0 d-flex align-items-center text-decoration-none position-relative">
                <i className="bx bx-envelope fs-5 me-2 position-relative">
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.5rem' }}
                  >
                    3
                  </span>
                </i>
                <span>Invites</span>
              </button>
            ) : (
              <Link to="/invites" className="nav-link text-white px-0 d-flex align-items-center">
                <i className="bx bx-envelope fs-5 me-2"></i>
                <span>Invites</span>
              </Link>
            )}
          </li>

          <li>
            {isAuthenticated ? (
              <button className="btn btn-link text-white px-0 d-flex align-items-center text-decoration-none">
                <i className="bx bx-cog fs-5 me-2"></i>
                <span>Settings</span>
              </button>
            ) : (
              <Link to="/profile" className="nav-link text-white px-0 d-flex align-items-center">
                <i className="bx bx-cog fs-5 me-2"></i>
                <span>Settings</span>
              </Link>
            )}
          </li>
        </ul>
      </div>

      {/* 👤 Bottom Section: Profile & Logout */}
      {isAuthenticated && (
        <div className="pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="bx bx-user-circle fs-4 me-2"></i>
              <span className="fw-semibold">{currentUser.name}</span>
            </div>
            <button className="btn text-white p-0" title="Logout">
              <i className="bx bx-log-out fs-4"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
