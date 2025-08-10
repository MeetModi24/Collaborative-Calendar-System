// src/slices/eventsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ---- Cache Manager ----
const calendarCache = {
  get: (groupId) => {
    const cacheKey = `calendar_events_${groupId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp, ttl } = JSON.parse(cached);
    const now = Date.now();
    if (now > timestamp + (ttl || 3600000)) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return { data, timestamp, ttl };
  },

  set: (groupId, data, ttl = 3600000) => {
    const cacheKey = `calendar_events_${groupId}`;
    const cacheValue = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheValue));
  },

  clearAll: () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("calendar_events_")) {
        localStorage.removeItem(key);
      }
    });
  },

  clearGroup: (groupId) => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`calendar_events_${groupId}`)) {
        localStorage.removeItem(key);
      }
    });
  },

  clearEvent: (groupId, eventId) => {
    const cacheKey = `calendar_events_${groupId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return;

    try {
      const { data, timestamp, ttl } = JSON.parse(cached);
      const updatedEvents = data.filter((e) => e.id !== eventId);
      if (updatedEvents.length !== data.length) {
        const newCacheValue = {
          data: updatedEvents,
          timestamp,
          ttl,
        };
        localStorage.setItem(cacheKey, JSON.stringify(newCacheValue));
      }
    } catch (e) {
      console.error("Error clearing event from cache:", e);
    }
  },
};

// ---- Async Thunks ----

// Fetch events for a group
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (groupId) => {
    const cached = calendarCache.get(groupId);
    if (cached) {
      return { groupId, events: cached.data, fromCache: true };
    }

    const res = await fetch(`http://127.0.0.1:5000/api/groups/${groupId}/events`, {
      credentials: "include",
    });
    const data = await res.json();

    const mapped = data.events.map((ev) => ({
      id: ev.event_id,
      title: ev.event_name,
      start: ev.start_time,
      end: ev.end_time,
      description: ev.description,
      participants: ev.participants,
      status: ev.status || "approved",
      version: ev.version || 0,
    }));

    calendarCache.set(groupId, mapped);
    return { groupId, events: mapped, fromCache: false };
  }
);

// Add a new event
export const addEvent = createAsyncThunk(
  "events/addEvent",
  async ({ groupId, eventData }) => {
    const res = await fetch("http://127.0.0.1:5000/api/groups/add_event", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...eventData, group_id: groupId }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const newEv = {
      id: data.event_id || Date.now(),
      ...eventData,
      version: 0,
    };

    const cached = calendarCache.get(groupId)?.data || [];
    calendarCache.set(groupId, [...cached, newEv]);

    return { groupId, event: newEv };
  }
);

// Update an existing event
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async ({ groupId, eventId, updates }) => {
    const payload = {
      title: updates.title,
      description: updates.description,
      start: updates.start,
      end: updates.end,
      participants: updates.participants || [],
      group_id: groupId,
      version: updates.version || 0,
    };

    const res = await fetch(`http://127.0.0.1:5000/api/groups/update_event/${eventId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const cached = calendarCache.get(groupId)?.data || [];
    const updatedList = cached.map((ev) =>
      ev.id === eventId ? { ...ev, ...updates } : ev
    );
    calendarCache.set(groupId, updatedList);

    return { groupId, eventId, updates };
  }
);

// Remove an event
export const removeEvent = createAsyncThunk(
  "events/removeEvent",
  async ({ groupId, eventId }) => {
    const res = await fetch(`http://127.0.0.1:5000/api/groups/remove_event/${eventId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    calendarCache.clearEvent(groupId, eventId);
    return { groupId, eventId };
  }
);

// ---- Slice ----
const eventsSlice = createSlice({
  name: "events",
  initialState: {
    eventsByGroup: {},
    status: "idle",
    error: null,
  },
  reducers: {
    clearAllCache: () => {
      calendarCache.clearAll();
      return { eventsByGroup: {}, status: "idle", error: null };
    },
    clearGroupCache: (state, action) => {
      const groupId = action.payload;
      calendarCache.clearGroup(groupId);
      delete state.eventsByGroup[groupId];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.eventsByGroup[action.payload.groupId] = action.payload.events;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        const { groupId, event } = action.payload;
        state.eventsByGroup[groupId] = [
          ...(state.eventsByGroup[groupId] || []),
          event,
        ];
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const { groupId, eventId, updates } = action.payload;
        state.eventsByGroup[groupId] = state.eventsByGroup[groupId].map((ev) =>
          ev.id === eventId ? { ...ev, ...updates } : ev
        );
      })
      .addCase(removeEvent.fulfilled, (state, action) => {
        const { groupId, eventId } = action.payload;
        state.eventsByGroup[groupId] = state.eventsByGroup[groupId].filter(
          (ev) => ev.id !== eventId
        );
      });
  },
});

// ---- Selectors ----
export const selectEventsByGroup = (state, groupId) =>
  state.events.eventsByGroup[groupId] || [];

export const selectEventsStatus = (state) => state.events.status;

export const { clearAllCache, clearGroupCache } = eventsSlice.actions;
export default eventsSlice.reducer;
