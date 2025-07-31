
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CalendarPage from "./pages/CalendarPage";

import SignupPage from './pages/SignupPage';
import SigninPage from './pages/SigninPage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/calendar" element={<CalendarPage />} />

      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signin" element={<SigninPage />} />

    </Routes>
  );
}

export default App;
