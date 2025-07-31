// src/components/TopNavbar.jsx
import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';

export default function TopNavbar({ toggleSidebar }) {
  return (
    <Navbar bg="light" expand="lg" className="px-4 shadow-sm d-flex justify-content-between">
      <div className="d-flex align-items-center">
        <button className="btn btn-outline-secondary me-3" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <Navbar.Brand href="/">Event Management System</Navbar.Brand>
      </div>
      <Nav className="ms-auto">
        <Nav.Link href="#">Home</Nav.Link>
        <Nav.Link href="#">Signup</Nav.Link>
        <Nav.Link href="#">Signin</Nav.Link>
      </Nav>
    </Navbar>
  );
}
