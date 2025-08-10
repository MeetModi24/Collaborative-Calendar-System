import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";
import Tooltip from "bootstrap/js/dist/tooltip";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Needed for tooltip
import "../styles/calendar.css";

import CreateGroupModal from "../components/CreateGroupModal";
import AppLayout from "../components/AppLayout";

export default function CalendarPage() {
  const calendarRef = useRef(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(1);
  const [events, setEvents] = useState([]);
  const [permission, setPermission] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    participants: [],
  });

  const [currentEvent, setCurrentEvent] = useState(null);

  // Fetch groups on mount
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/groups/list", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        const formatted = [{ id: 1, name: "Dashboard" }, ...data.groups];
        setGroups(formatted);
      })
      .catch((err) => console.error("Error fetching groups:", err));
  }, []);

  // Fetch events & permission when group changes
  useEffect(() => {
    if (!selectedGroup) return;

    // Get events
    fetch(`http://127.0.0.1:5000/api/groups/${selectedGroup}/events`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.events.map((ev) => ({
          id: ev.event_id,
          title: ev.event_name,
          start: ev.start_time,
          end: ev.end_time,
          description: ev.description,
          participants: ev.participants,
          status: ev.status || "approved", // use backend status if provided
        }));
        setEvents(mapped);
      })
      .catch((err) => console.error("Error fetching events:", err));

    // Get permission
    fetch(
      `http://127.0.0.1:5000/api/groups/get_group_permission/${selectedGroup}`,
      {
        credentials: "include",
      }
    )
      .then((res) => res.json())
      .then((data) => setPermission(data.permission))
      .catch(() => setPermission(null));
  }, [selectedGroup]);

  const handleDateClick = (info) => {
    setNewEvent({
      title: "",
      start: info.dateStr,
      end: info.dateStr,
      description: "",
      participants: [],
    });
    setShowAddModal(true);
  };

  const handleEventClick = (info) => {
    setCurrentEvent(info.event);
    setShowViewModal(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;

    fetch("http://127.0.0.1:5000/api/groups/add_event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newEvent, group_id: selectedGroup }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setEvents([...events, { id: Date.now(), ...newEvent }]);
          setShowAddModal(false);
        } else {
          alert(data.error);
        }
      })
      .catch((err) => console.error("Error adding event:", err));
  };

  const handleUpdateEvent = () => {
    if (!currentEvent) return;
    const eventId = currentEvent.id;

    fetch(`http://127.0.0.1:5000/api/groups/update_event/${eventId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: currentEvent.title,
        description: currentEvent.extendedProps.description,
        start: currentEvent.startStr,
        end: currentEvent.endStr,
        participants: currentEvent.extendedProps.participants,
        group_id: selectedGroup,
        version: currentEvent.extendedProps.version || 0,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setEvents(
            events.map((ev) =>
              ev.id === eventId
                ? {
                    ...ev,
                    title: currentEvent.title,
                    description: currentEvent.extendedProps.description,
                    start: currentEvent.startStr,
                    end: currentEvent.endStr,
                  }
                : ev
            )
          );
          setShowViewModal(false);
        } else {
          alert(data.error);
        }
      })
      .catch((err) => console.error("Error updating event:", err));
  };

  const handleRemoveEvent = () => {
    if (!currentEvent) return;
    const eventId = currentEvent.id;

    fetch(`http://127.0.0.1:5000/api/groups/remove_event/${eventId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setEvents(events.filter((ev) => ev.id !== eventId));
          setShowViewModal(false);
        } else {
          alert(data.error);
        }
      })
      .catch((err) => console.error("Error deleting event:", err));
  };

  // Bootstrap tooltip + pending opacity
  const handleEventDidMount = (info) => {
    new Tooltip(info.el, {
      title: info.event.extendedProps.description || info.event.title,
      placement: "top",
      trigger: "hover",
      container: "body",
    });

    if (info.event.extendedProps.status === "pending") {
      info.el.style.opacity = "0.5";
    }
  };


  return (
    <AppLayout>
      <div className="container py-4">
        <div className="calendar-container bg-white rounded shadow p-4">
          <header className="calendar-header">
            <h1>CALENDAR</h1>
            <div className="search-bar">
              <select
                id="group-select"
                className="form-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(Number(e.target.value))}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setShowCreateGroupModal(true)}
              >
                <i className="bx bx-cog"></i> Group Settings
              </button>
            </div>
          </header>

          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              bootstrap5Plugin,
            ]}
            initialView="dayGridMonth"
            themeSystem="bootstrap5"
            selectable={permission !== "Viewer"}
            editable={permission !== "Viewer"}
            events={events}
            dateClick={permission !== "Viewer" ? handleDateClick : null}
            eventClick={handleEventClick}
            eventDidMount={handleEventDidMount} // ✅ Added
          />
        </div>

        <CreateGroupModal
          show={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
        />

        {/* Add Event Modal */}
        {showAddModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Create New Event</h4>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <label>Event name</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                  <label>Start Date</label>
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={newEvent.start}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, start: e.target.value })
                    }
                  />
                  <label>End Date</label>
                  <input
                    type="datetime-local"
                    className="form-control mb-2"
                    value={newEvent.end}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, end: e.target.value })
                    }
                  />
                  <label>Event Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                  ></textarea>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveEvent}
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View/Edit Modal */}
        {showViewModal && currentEvent && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Event</h4>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowViewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <label>Event name</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={currentEvent.title}
                    onChange={(e) => {
                      currentEvent.setProp("title", e.target.value);
                      setCurrentEvent({ ...currentEvent });
                    }}
                  />
                  <label>Description</label>
                  <textarea
                    className="form-control mb-2"
                    value={currentEvent.extendedProps.description || ""}
                    onChange={(e) => {
                      currentEvent.setExtendedProp(
                        "description",
                        e.target.value
                      );
                      setCurrentEvent({ ...currentEvent });
                    }}
                  ></textarea>
                </div>
                <div className="modal-footer">
                  {permission !== "Viewer" && (
                    <>
                      <button
                        className="btn btn-danger"
                        onClick={handleRemoveEvent}
                      >
                        Remove Event
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleUpdateEvent}
                      >
                        Save Changes
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
