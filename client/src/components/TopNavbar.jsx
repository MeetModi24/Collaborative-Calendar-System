import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

export default function TopNavbar() {
  return (
    <Navbar bg="light" expand="lg" className="px-4 shadow-sm d-flex justify-content-between">
      <Navbar.Brand href="/">Event Management System</Navbar.Brand>
      <Nav className="ms-auto">
        <Nav.Link href="#">Home</Nav.Link>
        <Nav.Item><Link to="/signup" className="nav-link">Signup</Link></Nav.Item>
        <Nav.Item><Link to="/signin" className="nav-link">Signin</Link></Nav.Item>
      </Nav>
    </Navbar>
  );
}
