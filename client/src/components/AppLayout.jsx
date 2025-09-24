// src/components/AppLayout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import FlashMessages from "./FlashMessages";
import CreateGroupModal from "./CreateGroupModal";
import ProfileSettingsModal from "./ProfileSettingsModal";
import InvitesModal from "./InvitesModal";
import { useFlash } from "../context/FlashContext"; //  import from your new context

export default function AppLayout({ children }) {
  const [collapsed, setCollapsed] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [showInvitesModal, setShowInvitesModal] = useState(false);

  const { flashMessages, addFlashMessage } = useFlash(); // now using global state

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <div className="d-flex" style={{ minHeight: "100vh", overflowX: "hidden" }}>
      <Sidebar
        collapsed={collapsed}
        toggleSidebar={toggleSidebar}
        onCreateGroupClick={() => setShowCreateGroupModal(true)}
        onProfileSettingsClick={() => setShowProfileSettingsModal(true)}
        onInvitesClick={() => setShowInvitesModal(true)}
        addFlashMessage={addFlashMessage} // still pass to Sidebar if needed
      />

      <div className="flex-grow-1">
        <TopNavbar />
        <div className="container mt-4">
          <FlashMessages messages={flashMessages} /> {/*  now coming from context */}
          {children}
        </div>
      </div>

      {/* Global Modals */}
      <CreateGroupModal
        show={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
      <ProfileSettingsModal
        show={showProfileSettingsModal}
        onClose={() => setShowProfileSettingsModal(false)}
      />
      <InvitesModal
        show={showInvitesModal}
        onClose={() => setShowInvitesModal(false)}
        invites={[]}
      />
    </div>
  );
}
