// src/components/AppLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="d-flex">
      {sidebarOpen && <Sidebar />}
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        {/* Optional: Flash messages */}
        <div className="container mt-3">
          {children}
        </div>
      </div>
    </div>
  );
}
