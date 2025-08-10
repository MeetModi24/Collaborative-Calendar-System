// src/context/FlashContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const FlashContext = createContext();

export function FlashProvider({ children }) {
  const [flashMessages, setFlashMessages] = useState([]);

  const addFlashMessage = useCallback((type, message) => {
    setFlashMessages((prev) => [...prev, [type, message]]);
  }, []);

  return (
    <FlashContext.Provider value={{ flashMessages, addFlashMessage }}>
      {children}
    </FlashContext.Provider>
  );
}

export function useFlash() {
  return useContext(FlashContext);
}
