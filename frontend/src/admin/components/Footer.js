import React from 'react';
import { Container } from 'react-bootstrap';
import './Footer.css';

function Footer() {
  return (
    <footer className="admin-footer">
      <Container>
        <div className="text-center">
          <p className="mb-0">&copy; {new Date().getFullYear()} CaliberWatch Admin. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
