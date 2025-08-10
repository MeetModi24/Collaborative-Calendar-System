// src/components/AppLayout.jsx
import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import FlashMessages from './FlashMessages';
import CreateGroupModal from './CreateGroupModal';
import ProfileSettingsModal from './ProfileSettingsModal';
import InvitesModal from './InvitesModal';

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(true);
  const [flashMessages, setFlashMessages] = useState([]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [showInvitesModal, setShowInvitesModal] = useState(false);

  const addFlashMessage = useCallback((type, message) => {
    setFlashMessages((prev) => [...prev, [type, message]]);
  }, []);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <Sidebar
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
        onCreateGroupClick={() => setShowCreateGroupModal(true)}
        onProfileSettingsClick={() => setShowProfileSettingsModal(true)}
        onInvitesClick={() => setShowInvitesModal(true)}
        addFlashMessage={addFlashMessage}  
      />

      <div className="flex-grow-1">
        <TopNavbar />
        <div className="container mt-4">
          <FlashMessages messages={flashMessages} />
          {children}
        </div>
      </div>

      {/* Global Modals */}
      <CreateGroupModal show={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} />
      <ProfileSettingsModal show={showProfileSettingsModal} onClose={() => setShowProfileSettingsModal(false)} />
      <InvitesModal show={showInvitesModal} onClose={() => setShowInvitesModal(false)} invites={[]} />
    </div>
  );
}
