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

import ParticipantsList from '../components/ParticipantsList'; 

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

  // Controls visibility and editability as per showEventModal logic
  const [participantSectionVisible, setParticipantSectionVisible] = useState(false);
  const [participantSelectVisible, setParticipantSelectVisible] = useState(false);
  const [modalCloseBtnVisible, setModalCloseBtnVisible] = useState(true);

  const [startDateReadOnly, setStartDateReadOnly] = useState(true);
  const [startTimeReadOnly, setStartTimeReadOnly] = useState(true);
  const [endDateReadOnly, setEndDateReadOnly] = useState(true);
  const [endTimeReadOnly, setEndTimeReadOnly] = useState(true);

  const [titleEditable, setTitleEditable] = useState(false);
  const [descriptionEditable, setDescriptionEditable] = useState(false);


  // Fetch groups on mount
  useEffect(() => {
  // Fetch groups from API
    fetch("http://127.0.0.1:5000/api/groups/get_groups", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => console.error("Failed to load groups", err));
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
    // 1. Remove existing popovers (fc-more-popover)
    document.querySelectorAll(".fc-more-popover").forEach((el) => el.remove());

    // 2. Hide bootstrap tooltip if any
    const tooltip = Tooltip.getInstance(info.el);
    if (tooltip) {
      tooltip.hide();
    }

    const event = info.event;
    const participants = event.extendedProps.participants
      ? [...event.extendedProps.participants]
      : [];
    const pendingParticipants = event.extendedProps.pending_participants
      ? [...event.extendedProps.pending_participants]
      : [];

    // Prepare event object for modal editing
    const eventForModal = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: {
        ...event.extendedProps,
        participants,
        pending_participants: pendingParticipants,
      },
      setProp: event.setProp.bind(event),
      setExtendedProp: event.setExtendedProp.bind(event),
      startStr: event.startStr,
      endStr: event.endStr,
    };

    // Determine permissions and UI flags
    const groupId = selectedGroup; // from state
    const groupPermission = event.extendedProps.event_edit_permission || "Viewer";

    if (groupId !== 1) {
      setParticipantSectionVisible(true);
      if (groupPermission !== "Viewer") {
        setParticipantSelectVisible(true);
        setModalCloseBtnVisible(false);
        setStartDateReadOnly(false);
        setStartTimeReadOnly(false);
        setEndDateReadOnly(false);
        setEndTimeReadOnly(false);
        setTitleEditable(true);
        setDescriptionEditable(true);
      } else {
        setParticipantSelectVisible(false);
        setModalCloseBtnVisible(true);
        setStartDateReadOnly(true);
        setStartTimeReadOnly(true);
        setEndDateReadOnly(true);
        setEndTimeReadOnly(true);
        setTitleEditable(false);
        setDescriptionEditable(false);
      }
      // setupParticipantsSection logic can be ported here if needed
    } else {
      if (event.extendedProps.event_type === "group") {
        setParticipantSectionVisible(true);
        // setupParticipantsSection logic with 'Viewer' permission here if needed
        setParticipantSelectVisible(false);
        setStartDateReadOnly(true);
        setStartTimeReadOnly(true);
        setEndDateReadOnly(true);
        setEndTimeReadOnly(true);
        setTitleEditable(false);
        setDescriptionEditable(false);
        setModalCloseBtnVisible(true);
      } else {
        setParticipantSectionVisible(false);
        setParticipantSelectVisible(false);
        setStartDateReadOnly(false);
        setStartTimeReadOnly(false);
        setEndDateReadOnly(false);
        setEndTimeReadOnly(false);
        setTitleEditable(true);
        setDescriptionEditable(true);
        setModalCloseBtnVisible(false);
      }
    }

    // Save event and open modal
    setCurrentEvent(eventForModal);
    setShowViewModal(true);

    // Prevent default FullCalendar navigation
    info.jsEvent.preventDefault();
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
                    key={g.group_id}                           // use group_id here
                    id={`group-select-option-${g.group_id}`}  // and here
                    value={g.group_id}                         // and as value
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
          <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Create New Event</h4>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                    aria-label="Close"
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
          <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">Edit Event</h4>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowViewModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Participants Section */}
                  {participantSectionVisible && (
                    <div id="participants-section" className="mb-3">
                      <p><strong>Participants:</strong></p>
                      {/* Render the imported ParticipantsList component here */}
                      <ParticipantsList event={currentEvent} permission={permission} />
                    </div>
                  )}
                  {/* Editable Event Name */}
                  {titleEditable ? (
                    <input
                      type="text"
                      className="form-control mb-2"
                      value={currentEvent.title}
                      onChange={(e) => {
                        currentEvent.setProp("title", e.target.value);
                        setCurrentEvent({ ...currentEvent });
                      }}
                    />
                  ) : (
                    <div
                      className="form-control mb-2"
                      style={{ backgroundColor: "#e9ecef" }}
                      aria-readonly="true"
                    >
                      {currentEvent.title}
                    </div>
                  )}

                  {/* Editable Description */}
                  {descriptionEditable ? (
                    <textarea
                      className="form-control mb-2"
                      value={currentEvent.extendedProps.description || ""}
                      onChange={(e) => {
                        currentEvent.setExtendedProp("description", e.target.value);
                        setCurrentEvent({ ...currentEvent });
                      }}
                    />
                  ) : (
                    <div
                      className="form-control mb-2"
                      style={{ backgroundColor: "#e9ecef", minHeight: "100px" }}
                      aria-readonly="true"
                    >
                      {currentEvent.extendedProps.description || "No description"}
                    </div>
                  )}

                  {/* Start Date/Time Inputs */}
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    readOnly={startDateReadOnly}
                    value={
                      currentEvent.start
                        ? currentEvent.start.toISOString().substring(0, 10)
                        : ""
                    }
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const startTime = currentEvent.start
                        ? currentEvent.start.toISOString().substring(11, 16)
                        : "00:00";
                      const newStart = new Date(`${newDate}T${startTime}:00Z`);
                      currentEvent.setProp("start", newStart);
                      setCurrentEvent({ ...currentEvent });
                    }}
                  />
                  <label>Start Time</label>
                  <input
                    type="time"
                    className="form-control mb-2"
                    readOnly={startTimeReadOnly}
                    value={
                      currentEvent.start
                        ? currentEvent.start.toISOString().substring(11, 16)
                        : ""
                    }
                    onChange={(e) => {
                      const newTime = e.target.value;
                      const startDate = currentEvent.start
                        ? currentEvent.start.toISOString().substring(0, 10)
                        : "";
                      const newStart = new Date(`${startDate}T${newTime}:00Z`);
                      currentEvent.setProp("start", newStart);
                      setCurrentEvent({ ...currentEvent });
                    }}
                  />

                  {/* End Date/Time Inputs */}
                  <label>End Date</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    readOnly={endDateReadOnly}
                    value={
                      currentEvent.end
                        ? currentEvent.end.toISOString().substring(0, 10)
                        : ""
                    }
                    onChange={(e) => {
                      const newDate = e.target.value;
                      const endTime = currentEvent.end
                        ? currentEvent.end.toISOString().substring(11, 16)
                        : "00:00";
                      const newEnd = new Date(`${newDate}T${endTime}:00Z`);
                      currentEvent.setProp("end", newEnd);
                      setCurrentEvent({ ...currentEvent });
                    }}
                  />
                  <label>End Time</label>
                  <input
                    type="time"
                    className="form-control mb-2"
                    readOnly={endTimeReadOnly}
                    value={
                      currentEvent.end
                        ? currentEvent.end.toISOString().substring(11, 16)
                        : ""
                    }
                    onChange={(e) => {
                      const newTime = e.target.value;
                      const endDate = currentEvent.end
                        ? currentEvent.end.toISOString().substring(0, 10)
                        : "";
                      const newEnd = new Date(`${endDate}T${newTime}:00Z`);
                      currentEvent.setProp("end", newEnd);
                      setCurrentEvent({ ...currentEvent });
                    }}
                  />
                </div>
                <div className="modal-footer">
                  {permission !== "Viewer" ? (
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
                  ) : (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowViewModal(false)}
                    >
                      Close
                    </button>
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
