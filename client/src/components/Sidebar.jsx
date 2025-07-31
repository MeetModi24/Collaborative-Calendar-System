// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar({ width = 250 }) {
  const isAuthenticated = true;
  const currentUser = { name: 'John Doe' };

  return (
    <div
      className="bg-dark text-white d-flex flex-column justify-content-between p-3"
      style={{ width: `${width}px`, height: '100vh' }}
    >
      {/* Logo & Nav */}
      <div>
        <div className="d-flex align-items-center mb-4 ps-1">
          <i className="bx bxs-dashboard fs-4 me-2"></i>
          <h5 className="mb-0 fw-bold">Workspace</h5>
        </div>

        {/* Search */}
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

        {/* Nav Items */}
        <ul className="nav flex-column gap-2">
          <li><Link to="/calendar" className="nav-link text-white px-0 d-flex align-items-center"><i className="bx bx-calendar fs-5 me-2"></i>Calendar</Link></li>
          <li><Link to="/create-group" className="nav-link text-white px-0 d-flex align-items-center"><i className="bx bxs-user-plus fs-5 me-2"></i>Create Group</Link></li>
          <li><Link to="/invites" className="nav-link text-white px-0 d-flex align-items-center"><i className="bx bx-envelope fs-5 me-2"></i>Invites</Link></li>
          <li><Link to="/profile" className="nav-link text-white px-0 d-flex align-items-center"><i className="bx bx-cog fs-5 me-2"></i>Settings</Link></li>
        </ul>
      </div>

      {/* Profile & Logout */}
      {isAuthenticated && (
        <div className="pt-3 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <i className="bx bx-user-circle fs-4 me-2"></i>
              <span className="fw-semibold">{currentUser.name}</span>
            </div>
            <button className="btn text-white p-0"><i className="bx bx-log-out fs-4"></i></button>
          </div>
        </div>
      )}
    </div>
  );
}
