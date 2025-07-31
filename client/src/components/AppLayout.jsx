// src/components/AppLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import FlashMessages from './FlashMessages';

export default function AppLayout({ children, flashMessages = [] }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSidebar = () => setShowSidebar(!showSidebar);

  const sidebarWidth = 250; // px

  return (
    <div className="d-flex" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Sidebar Area */}
      <div
        className="transition-all"
        style={{
          width: showSidebar ? `${sidebarWidth}px` : '0px',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        <Sidebar width={sidebarWidth} />
      </div>

      {/* Main Page Content Area */}
      <div className="flex-grow-1">
        <TopNavbar toggleSidebar={toggleSidebar} />
        <div className="container mt-4">
          <FlashMessages messages={flashMessages} />
          {children}
        </div>
      </div>
    </div>
  );
}
