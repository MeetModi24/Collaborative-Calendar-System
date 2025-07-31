import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import FlashMessages from './FlashMessages';

export default function AppLayout({ children, flashMessages = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Sidebar collapsed={collapsed} toggleSidebar={toggleSidebar} />

      <div className="flex-grow-1">
        <TopNavbar />
        <div className="container mt-4">
          <FlashMessages messages={flashMessages} />
          {children}
        </div>
      </div>
    </div>
  );
}
