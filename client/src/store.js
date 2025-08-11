import { configureStore } from "@reduxjs/toolkit";
import eventsReducer from "./slices/eventsSlice";

// Load state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem("reduxState");
    if (!serializedState) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

// Save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("reduxState", serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

const preloadedState = loadState();

const store = configureStore({
  reducer: {
    events: eventsReducer,
  },
  preloadedState,
});

// Save to localStorage whenever Redux state changes
store.subscribe(() => {
  saveState({
    events: store.getState().events,
  });
});

export default store;
