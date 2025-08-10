import React, { useState, useEffect } from "react";
import { useFlash } from "../context/FlashContext";

export default function CreateGroupModal({ show, onClose }) {
  const { addFlashMessage } = useFlash();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Editor");
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clear error when inputs change
  useEffect(() => {
    if (error) setError("");
  }, [email, groupName, role]);

  const handleAddMember = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email");
      return;
    }
    if (members.find((m) => m.email === trimmedEmail)) {
      setError("Member already added");
      return;
    }
    setMembers([...members, { email: trimmedEmail, role }]);
    setEmail("");
    setRole("EDITOR");
    setError("");
  };

  const removeMember = (emailToRemove) => {
    setMembers(members.filter((m) => m.email !== emailToRemove));
  };

  const handleCreateGroup = async () => {
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) {
      addFlashMessage("danger", "Group name is required.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);

    try {
      const payload = {
        name: trimmedGroupName,
        description: description.trim(),
        members: members.map((m) => m.email),
        permissions: members.map((m) => m.role),
      };

      const res = await fetch("http://127.0.0.1:5000/api/groups/create_group", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create group");
      }

      const data = await res.json();

      if (data.emails?.length) {
        addFlashMessage("danger", "No users found: " + data.emails.join(", "));
      } else {
        addFlashMessage("success", "Group created successfully!");
        // Clear form on success
        setGroupName("");
        setDescription("");
        setMembers([]);
      }

      onClose();
    } catch (err) {
      console.error("Error creating group:", err);
      addFlashMessage("danger", "Something went wrong: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      aria-labelledby="createGroupModalLabel"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content" aria-live="polite">
          <div className="modal-header">
            <h5 className="modal-title" id="createGroupModalLabel">
              Create New Group
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={submitting}
            />
          </div>
          <div className="modal-body">
            <label htmlFor="groupNameInput" className="form-label fw-bold">
              Group Name
            </label>
            <input
              id="groupNameInput"
              type="text"
              className="form-control mb-3"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={submitting}
              autoFocus
            />

            <label htmlFor="groupDescriptionInput" className="form-label fw-bold">
              Description
            </label>
            <textarea
              id="groupDescriptionInput"
              className="form-control mb-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              rows={5}
              style={{ resize: "vertical" }}
            />

            <label htmlFor="memberEmailInput" className="form-label fw-bold">
              Members
            </label>
            <div className="input-group mb-2">
              <input
                id="memberEmailInput"
                type="email"
                className={`form-control ${error ? "is-invalid" : ""}`}
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMember();
                  }
                }}
              />
              <select
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={submitting}
              >
                <option value="Editor">EDITOR</option>
                <option value="Viewer">VIEWER</option>
                <option value="Admin">ADMIN</option>
              </select>
              <button
                className="btn btn-dark"
                type="button"
                onClick={handleAddMember}
                disabled={submitting}
              >
                ADD +
              </button>
            </div>
            {error && <div className="text-danger mb-2">{error}</div>}

            <div className="d-flex flex-wrap gap-2" aria-live="polite" aria-relevant="additions removals">
              {members.map((m) => (
                <span
                  className="badge bg-dark d-flex align-items-center"
                  key={m.email}
                >
                  {m.email} ({m.role})
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    aria-label={`Remove member ${m.email}`}
                    onClick={() => removeMember(m.email)}
                    disabled={submitting}
                  />
                </span>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              CANCEL
            </button>
            <button
              className="btn btn-dark"
              onClick={handleCreateGroup}
              disabled={submitting}
            >
              {submitting ? "Creating..." : "CREATE GROUP"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
