import React from 'react';
import { FaCalendarAlt, FaUsers, FaBell, FaCog } from 'react-icons/fa';

export default function Sidebar() {
  return (
    <div className="d-flex flex-column bg-dark text-white vh-100 p-3" style={{ width: '250px' }}>
      <h4 className="mb-4">Workspace</h4>
      <input className="form-control mb-3" placeholder="Search..." />
      <ul className="nav flex-column">
        <li className="nav-item mb-2"><FaCalendarAlt /> <span className="ms-2">Calendar</span></li>
        <li className="nav-item mb-2"><FaUsers /> <span className="ms-2">Create Group</span></li>
        <li className="nav-item mb-2"><FaBell /> <span className="ms-2">Invites</span></li>
        <li className="nav-item"><FaCog /> <span className="ms-2">Settings</span></li>
      </ul>
    </div>
  );
}
