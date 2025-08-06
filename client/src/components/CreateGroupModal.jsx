import React, { useState } from "react";
import { useAuth } from '../context/AuthContext';

export default function CreateGroupModal({ show, onClose }) {
  const { addFlashMessage } = useAuth(); // ✅ Use context instead of prop

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAddMember = () => {
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (members.find((m) => m.email === email.trim().toLowerCase())) {
      setError("Member already added");
      return;
    }

    setMembers([...members, { email: email.trim().toLowerCase(), role }]);
    setEmail("");
    setRole("EDITOR");
    setError("");
  };

  const removeMember = (emailToRemove) => {
    setMembers(members.filter((m) => m.email !== emailToRemove));
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      addFlashMessage("danger", "Group name is required.");
      return;
    }

    const payload = {
      name: groupName,
      description,
      members: members.map((m) => m.email),
      permissions: members.map((m) => m.role),
    };

    fetch("http://127.0.0.1:5000/api/groups/create_group", {
      method: "POST",
      credentials: "include", // Send session cookie
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text);
        }
        return res.json();
      })
      .then((data) => {
        if (data.emails && data.emails.length > 0) {
          addFlashMessage("danger", "No users found:\n" + data.emails.join(", "));
        } else {
          addFlashMessage("success", "Group created successfully!");
        }
        onClose();
      })
      .catch((err) => {
        console.error("Error creating group:", err);
        addFlashMessage("danger", "Something went wrong: " + err.message);
      });
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
            <input
              type="text"
              className="form-control mb-3"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />

            <label className="form-label fw-bold">Description</label>
            <textarea
              className="form-control mb-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="form-label fw-bold">Members</label>
            <div className="input-group mb-2">
              <input
                type="email"
                className="form-control"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="EDITOR">EDITOR</option>
                <option value="VIEWER">VIEWER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <button
                className="btn btn-dark"
                type="button"
                onClick={handleAddMember}
              >
                ADD +
              </button>
            </div>
            {error && <div className="text-danger mb-2">{error}</div>}

            <div className="d-flex flex-wrap gap-2">
              {members.map((m, i) => (
                <span className="badge bg-dark d-flex align-items-center" key={i}>
                  {m.email} ({m.role})
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    onClick={() => removeMember(m.email)}
                  ></button>
                </span>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              CANCEL
            </button>
            <button className="btn btn-dark" onClick={handleCreateGroup}>
              CREATE GROUP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
