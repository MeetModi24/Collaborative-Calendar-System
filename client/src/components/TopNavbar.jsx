import React, { useContext } from "react";
import { Navbar, Nav } from "react-bootstrap";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaVideo } from "react-icons/fa";
import { BsBellFill } from "react-icons/bs";

export default function TopNavbar() {
  const { isAuthenticated, currentUser } = useContext(AuthContext);

  return (
    <Navbar bg="light" expand="lg" className="px-4 shadow-sm">
      <Navbar.Brand as={Link} to="/">
        Event Management System
      </Navbar.Brand>

      <Nav className="ms-auto align-items-center">
        {isAuthenticated ? (
          <>
            {/* Google Meet Icon */}
            <Nav.Link
              href="https://meet.google.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Google Meet"
            >
              <FaVideo style={{ fontSize: "1.4rem" }} />
            </Nav.Link>

            {/* Notification Bell */}
            <Nav.Link
              role="button"
              id="notificationBtn"
              title="Notifications"
              className="position-relative"
            >
              <BsBellFill style={{ fontSize: "1.4rem" }} />
              <span
                id="notificationBadge"
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none"
              >
                <span className="visually-hidden">unread notifications</span>
              </span>
            </Nav.Link>

            {/* Signout */}
            <Nav.Item>
              <Link to="/signout" className="nav-link">
                Sign Out
              </Link>
            </Nav.Item>
          </>
        ) : (
          <>
            <Nav.Item>
              <Link to="/" className="nav-link">
                Home
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link to="/signup" className="nav-link">
                Signup
              </Link>
            </Nav.Item>
            <Nav.Item>
              <Link to="/signin" className="nav-link">
                Signin
              </Link>
            </Nav.Item>
          </>
        )}
      </Nav>
    </Navbar>
  );
}
