import React from 'react';
import { Navbar, Nav } from 'react-bootstrap';

export default function TopNavbar() {
  return (
    <Navbar bg="light" expand="lg" className="px-4 shadow-sm d-flex justify-content-between">
      <Navbar.Brand href="/">Event Management System</Navbar.Brand>
      <Nav className="ms-auto">
        <Nav.Link href="#">Home</Nav.Link>
        <Nav.Link href="#">Signup</Nav.Link>
        <Nav.Link href="#">Signin</Nav.Link>
      </Nav>
    </Navbar>
  );
}
