
import React, { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";

import "../styles/calendar.css"; // your custom overrides

import CreateGroupModal from "../components/CreateGroupModal";
import AppLayout from '../components/AppLayout'; 

export default function CalendarPage() {
  const calendarRef = useRef(null);

  // Group dropdown state
  const [groups] = useState([{ id: 1, name: "Dashboard" }, { id: 2, name: "Team A" }]);
  const [selectedGroup, setSelectedGroup] = useState(1);

  // Event state
  const [events, setEvents] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Group Create Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);


  // New Event Data
  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    description: "",
    participants: [],
  });

  // Selected Event Data
  const [currentEvent, setCurrentEvent] = useState(null);

  // Open "Create Event" modal
  const handleDateClick = (info) => {
    setNewEvent({ title: "", start: info.dateStr, end: info.dateStr, description: "", participants: [] });
    setShowAddModal(true);
  };

  // Open "View/Edit Event" modal
  const handleEventClick = (info) => {
    setCurrentEvent(info.event);
    setShowViewModal(true);
  };
  

  // Save new event
  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;
    setEvents([
      ...events,
      {
        id: Date.now(),
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end,
        description: newEvent.description,
        participants: newEvent.participants,
      },
    ]);
    setShowAddModal(false);
  };

  // Update event
  const handleUpdateEvent = () => {
    setEvents(
      events.map((ev) =>
        ev.id === Number(currentEvent.id)
          ? {
              ...ev,
              title: currentEvent.title,
              start: currentEvent.start,
              end: currentEvent.end,
              description: currentEvent.extendedProps.description,
              participants: currentEvent.extendedProps.participants,
            }
          : ev
      )
    );
    setShowViewModal(false);
  };

  // Delete event
  const handleRemoveEvent = () => {
    setEvents(events.filter((ev) => ev.id !== Number(currentEvent.id)));
    setShowViewModal(false);
  };

  return (
   <AppLayout>
    <div className="container py-4">
      <div className="calendar-container bg-white rounded shadow p-4">
        {/* Header */}
        <header className="calendar-header">
          <h1>CALENDAR</h1>
          <div className="search-bar">
            <select
              id="group-select"
              className="form-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button className="btn btn-outline-secondary"><i className="bx bx-cog"></i> Group Settings</button>
          </div>
        </header>

        {/* Calendar */}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
          initialView="dayGridMonth"
          themeSystem="bootstrap5"
          selectable
          editable
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
        />
      </div>

      {/* {Group Create Modal} */}

      <CreateGroupModal show={showCreateGroupModal} onClose={() => setShowCreateGroupModal(false)} />

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">Create New Event</h4>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <div className="modal-body">
                <label>Event name</label>
                <input type="text" className="form-control mb-2"
                  value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                <label>Start Date</label>
                <input type="datetime-local" className="form-control mb-2"
                  value={newEvent.start} onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })} />
                <label>End Date</label>
                <input type="datetime-local" className="form-control mb-2"
                  value={newEvent.end} onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })} />
                <label>Event Description</label>
                <textarea className="form-control" rows="4"
                  value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveEvent}>Create Event</button>
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
                <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <label>Event name</label>
                <input type="text" className="form-control mb-2"
                  value={currentEvent.title}
                  onChange={(e) => { currentEvent.setProp("title", e.target.value); setCurrentEvent({ ...currentEvent }); }} />
                <label>Description</label>
                <textarea className="form-control mb-2"
                  value={currentEvent.extendedProps.description || ""}
                  onChange={(e) => { currentEvent.setExtendedProp("description", e.target.value); setCurrentEvent({ ...currentEvent }); }}></textarea>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={handleRemoveEvent}>Remove Event</button>
                <button className="btn btn-primary" onClick={handleUpdateEvent}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}