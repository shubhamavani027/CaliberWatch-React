import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navigation.css';

function Navigation() {
  const { user, logout, loading } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(() => Number(localStorage.getItem('cartCount') || 0));

  useEffect(() => {
    const onScroll = () => setIsScrolled((window.scrollY || 0) > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const syncCartCount = () => {
      setCartCount(Number(localStorage.getItem('cartCount') || 0));
    };

    syncCartCount();
    window.addEventListener('storage', syncCartCount);
    window.addEventListener('cartUpdated', syncCartCount);

    return () => {
      window.removeEventListener('storage', syncCartCount);
      window.removeEventListener('cartUpdated', syncCartCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayCartCount = cartCount > 99 ? '99+' : String(cartCount);

  return (
    <Navbar expand="lg" fixed="top" className={`lux-navbar ${isScrolled ? 'lux-navbar--scrolled' : ''}`}>
      <Container fluid className="lux-navbar__inner">
        <Navbar.Brand as={Link} to="/" className="lux-brand">
          <span className="lux-brand__wordmark">Caliber</span>
          <span className="lux-brand__accent">Watch</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" className="lux-toggler" />

        <Navbar.Collapse id="navbar-nav">
          <Nav className="mx-auto lux-nav lux-nav--center">
            <Nav.Link as={NavLink} to="/" className="lux-link">
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/watches" className="lux-link">
              Collection
            </Nav.Link>
            <Nav.Link as={NavLink} to="/about" className="lux-link">
              About
            </Nav.Link>
            <Nav.Link as={NavLink} to="/contact" className="lux-link">
              Contact
            </Nav.Link>
          </Nav>

          <Nav className="ms-auto lux-nav lux-nav--actions">
            <button
              type="button"
              className="lux-themeToggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="lux-themeToggle__track" aria-hidden="true">
                <span className={`lux-themeToggle__thumb lux-themeToggle__thumb--${theme}`}>
                  {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" className="lux-themeToggle__svg">
                      <path
                        d="M12 5.25V3m0 18v-2.25M6.75 6.75 5.16 5.16m13.68 13.68-1.59-1.59M5.25 12H3m18 0h-2.25M6.75 17.25l-1.59 1.59m13.68-13.68-1.59 1.59M12 16.5A4.5 4.5 0 1 0 12 7.5a4.5 4.5 0 0 0 0 9Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="lux-themeToggle__svg">
                      <path
                        d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a.35.35 0 0 0-.48-.42A9.75 9.75 0 1 0 20.82 15a.35.35 0 0 0-.42-.5Z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </span>
              </span>
            </button>

            <Nav.Link as={Link} to="/cart" className="lux-cartButton" aria-label="Open cart">
              <span className="lux-cart__well" aria-hidden="true">
                <span className="lux-cart__icon">
                  <svg viewBox="0 0 24 24" className="lux-cart__svg">
                    <path
                      d="M3.75 5.25h1.56c.73 0 1.37.5 1.55 1.2l.32 1.3m0 0h10.73c.9 0 1.57.84 1.38 1.72l-1 4.5a1.5 1.5 0 0 1-1.46 1.18H9.1a1.5 1.5 0 0 1-1.46-1.17L7.18 7.75Zm1.07 11.5a1.13 1.13 0 1 1 0-2.25 1.13 1.13 0 0 1 0 2.25Zm9 0a1.13 1.13 0 1 1 0-2.25 1.13 1.13 0 0 1 0 2.25Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {cartCount > 0 && (
                  <Badge bg="dark" className="lux-cart__badge">
                    {displayCartCount}
                  </Badge>
                )}
              </span>
            </Nav.Link>

            {!loading && user ? (
              <>
                <Nav.Link as={Link} to="/profile" className="lux-pillButton lux-pillButton--ghost">
                  Account
                </Nav.Link>
                <button type="button" onClick={handleLogout} className="lux-pillButton lux-pillButton--solid">
                  Logout
                </button>
              </>
            ) : !loading ? (
              <>
                <Nav.Link as={Link} to="/login" className="lux-pillButton lux-pillButton--ghost">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="lux-pillButton lux-pillButton--solid">
                  Sign Up
                </Nav.Link>
              </>
            ) : null}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
