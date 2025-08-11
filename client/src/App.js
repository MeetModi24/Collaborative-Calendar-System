import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";
import SignupPage from './pages/SignupPage';
import SigninPage from './pages/SigninPage';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FlashMessages from './components/FlashMessages';
import { NotificationsProvider } from "./context/NotificationsContext";
import { useState } from "react";

function App() {
  const [messages, setMessages] = useState([]);

  // Function to add a flash message
  const addFlashMessage = (type, text) => {
    setMessages((prev) => [...prev, [type, text]]);
  };

  return (
    <AuthProvider>
      <NotificationsProvider>
      <FlashMessages messages={messages} />
      <Routes>
        <Route path="/" element={<HomePage addFlashMessage={addFlashMessage} />} />
        <Route path="/signup" element={<SignupPage addFlashMessage={addFlashMessage} />} />
        <Route path="/signin" element={<SigninPage addFlashMessage={addFlashMessage} />} />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage addFlashMessage={addFlashMessage} />
            </ProtectedRoute>
          }
        />
      </Routes>
      </NotificationsProvider>
    </AuthProvider>
  );
}

export default App;
