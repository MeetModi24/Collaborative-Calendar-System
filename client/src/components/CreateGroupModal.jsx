// src/components/CreateGroupModal.jsx
import React, { useState } from "react";
// import "./CreateGroupModal.css"; // Optional for your custom styling

export default function CreateGroupModal({ show, onClose }) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [members, setMembers] = useState([]);

  const handleAddMember = () => {
    if (email.trim()) {
      setMembers([...members, { email, role }]);
      setEmail("");
      setRole("EDITOR");
    }
  };

  const handleCreateGroup = () => {
    const payload = {
      groupName,
      description,
      members,
    };
    console.log("Creating group:", payload);
    // TODO: Send payload to backend
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Group</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <label className="form-label fw-bold">Group Name</label>
            <input type="text" className="form-control mb-3" value={groupName} onChange={(e) => setGroupName(e.target.value)} />

            <label className="form-label fw-bold">Description</label>
            <textarea className="form-control mb-3" value={description} onChange={(e) => setDescription(e.target.value)} />

            <label className="form-label fw-bold">Members</label>
            <div className="input-group mb-3">
              <input type="email" className="form-control" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button className="btn btn-dark" onClick={handleAddMember}>ADD +</button>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>CANCEL</button>
            <button className="btn btn-dark" onClick={handleCreateGroup}>CREATE GROUP</button>
          </div>
        </div>
      </div>
    </div>
  );
}
