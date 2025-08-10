// src/pages/CalendarPage.jsx
import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";
import Tooltip from "bootstrap/js/dist/tooltip";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../styles/calendar.css";

import CreateGroupModal from "../components/CreateGroupModal";
import AppLayout from "../components/AppLayout";
import { useFlash } from "../context/FlashContext";


import { useDispatch, useSelector } from "react-redux";
import {
  fetchEvents,
  addEvent,
  updateEvent,
  removeEvent,
  selectEventsByGroup,
  selectEventsStatus,
} from "../slices/eventsSlice";

export default function CalendarPage() {
  const calendarRef = useRef(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(1);
  const events = useSelector((state) =>
    selectEventsByGroup(state, selectedGroup)
  );
  const eventsStatus = useSelector(selectEventsStatus);
  const dispatch = useDispatch();

  const [permission, setPermission] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  const { addFlashMessage } = useFlash(); 

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
    fetch("/api/groups/list", { credentials: "include" })
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
    dispatch(fetchEvents(selectedGroup)); // ✅ Redux-managed caching

    fetch(`/api/groups/get_group_permission/${selectedGroup}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setPermission(data.permission))
      .catch(() => setPermission(null));
  }, [selectedGroup, dispatch]);

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
    dispatch(addEvent({ groupId: selectedGroup, eventData: newEvent }));
    setShowAddModal(false);
    addFlashMessage("success", "Event created successfully!");
  };

  const handleUpdateEvent = () => {
    if (!currentEvent) return;
    dispatch(
      updateEvent({
        groupId: selectedGroup,
        eventId: currentEvent.id,
        updates: {
          title: currentEvent.title,
          description: currentEvent.extendedProps.description,
          start: currentEvent.startStr,
          end: currentEvent.endStr,
          participants: currentEvent.extendedProps.participants,
          version: currentEvent.extendedProps.version || 0,
        },
      })
    );
    setShowViewModal(false);
    addFlashMessage("success", "Event updated successfully!");
  };

  const handleRemoveEvent = () => {
    if (!currentEvent) return;
    dispatch(removeEvent({ groupId: selectedGroup, eventId: currentEvent.id }));
    setShowViewModal(false);
    addFlashMessage("success", "Event removed successfully!");
  };

  // Bootstrap tooltip + pending opacity
  const handleEventDidMount = (info) => {
    if (info.event.extendedProps.description) {
      let tooltip = Tooltip.getInstance(info.el);
      if (tooltip) {
        tooltip.dispose();
      }

      const desc = info.event.extendedProps.description;
      tooltip = new Tooltip(info.el, {
        title: desc.length > 200 ? desc.substring(0, 200) + "..." : desc,
        placement: "top",
        trigger: "hover",
        html: true,
        customClass: "multiline-tooltip",
        container: "body",
      });
    }

    if (info.event.extendedProps.is_pending_for_current_user) {
      info.el.style.opacity = "0.6";
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
                <option id="group-select-option-1" value={1}>Dashboard</option>
                {groups.map((g) => (
                  <option
                    key={g.id}
                    id={`group-select-option-${g.id}`}
                    value={g.id}
                  >
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

          {eventsStatus === "loading" ? (
            <p>Loading events...</p>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                interactionPlugin,
                bootstrap5Plugin,
              ]}
              initialView="dayGridMonth"
              // eventSources={[
              //   {
              //     events: function(fetchInfo, successCallback, failureCallback) {
              //       // Check Redux store for cached group events
              //       const cached = calendarCache.get(selectedGroup);

              //       if (cached) {
              //         successCallback(cached.data);
              //         // Optionally still check server for updates
              //       } else {
              //         fetch(`http://127.0.0.1:5000/api/groups/${selectedGroup}/events`)
              //           .then(r => r.json())
              //           .then(data => {
              //             calendarCache.set(selectedGroup, data);
              //             successCallback(data);
              //           })
              //           .catch(failureCallback);
              //       }
              //     }
              //   }
              // ]}
              events={events} // Redux-driven array
              timeZone="UTC"
              themeSystem="bootstrap5"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
              }}
              buttonText={{
                today: "Today",
                month: "Month",
                week: "Week",
                day: "Day",
                list: "List",
              }}
              weekNumbers={true}
              dayMaxEvents={true}
              eventTimeFormat={{
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                meridiem: "short",
              }}
              selectable={permission !== "Viewer"}
              nowIndicator={true}
              editable={permission !== "Viewer"}
              dateClick={permission !== "Viewer" ? handleDateClick : null}
              eventClick={handleEventClick}
              eventDidMount={handleEventDidMount}
            />
          )}
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
                  <button className="btn btn-primary" onClick={handleSaveEvent}>
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
