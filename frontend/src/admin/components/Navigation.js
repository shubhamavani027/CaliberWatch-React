import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import './Navigation.css';

function Navigation() {
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="navbar-admin" sticky="top">
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand as={Link} to={admin ? '/admin/dashboard' : '/admin'} className="navbar-admin-brand">
          <span className="admin-icon" aria-hidden="true">A</span>
          <span className="brand-text">CaliberWatch Admin</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="navbar-toggler-admin" />

        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav className="ms-auto align-items-lg-center gap-lg-2">
            {admin ? (
              <>
                <Nav.Link as={NavLink} to="/admin/dashboard" end className="nav-link-admin">
                  Dashboard
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin/watches" className="nav-link-admin">
                  Watches
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin/order" className="nav-link-admin">
                  Orders
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin/users" className="nav-link-admin">
                  Users
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin/analytics" className="nav-link-admin">
                  Analytics
                </Nav.Link>
                <Nav.Link as={NavLink} to="/admin/settings" className="nav-link-admin">
                  Settings
                </Nav.Link>

                <Nav.Link as={Link} to="/" className="nav-link-admin nav-link-store">
                  Visit Store
                </Nav.Link>

                <span className="admin-pill" title={admin.email}>
                  {admin.name || 'Admin'}
                </span>

                <Nav.Link onClick={handleLogout} className="nav-link-admin nav-link-danger">
                  Logout
                </Nav.Link>
              </>
            ) : (
              <Nav.Link as={NavLink} to="/admin" end className="nav-link-admin nav-link-primary">
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
