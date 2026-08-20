import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

import { newsletterAPI } from '../services/api';
import './Footer.css';

function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (newsletterLoading) return;

    const email = String(newsletterEmail || '').trim();
    if (!email) {
      Swal.fire('Email required', 'Please enter your email address.', 'info');
      return;
    }

    setNewsletterLoading(true);
    try {
      const res = await newsletterAPI.subscribe({ email, source: 'footer' });
      const message = res?.data?.message || 'Subscribed successfully.';
      Swal.fire('Subscribed', message, 'success');
      setNewsletterEmail('');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Subscription failed';
      Swal.fire('Error', message, 'error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <footer className="lux-footer">
      <Container>
        <div className="lux-footer__grid">
          <div>
            <Link to="/" className="lux-footer__brand">
              <span className="lux-footer__brandPrimary">CALIBER</span>
              <span className="lux-footer__brandAccent">WATCH</span>
            </Link>
            <p className="lux-footer__copy">
              Curated luxury timepieces built for precision, presence, and lasting confidence. Shop trusted brands,
              transparent listings, and premium support.
            </p>
            <div className="lux-footer__social" aria-label="Social links">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                F
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
                X
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                I
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                L
              </a>
            </div>
          </div>

          <div>
            <div className="lux-footer__heading">Explore</div>
            <ul className="lux-footer__links">
              <li>
                <Link to="/watches">All Watches</Link>
              </li>
              <li>
                <Link to="/brands">Brands</Link>
              </li>
              <li>
                <Link to="/about">Our Story</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="lux-footer__heading">Support</div>
            <ul className="lux-footer__links">
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
              <li>
                <Link to="/shipping">Shipping &amp; Returns</Link>
              </li>
              <li>
                <Link to="/contact">Contact Us</Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="lux-footer__heading">Newsletter</div>
            <p className="lux-footer__copy" style={{ marginBottom: 14 }}>
              Subscribe for early access to releases, offers, and Caliber updates.
            </p>
            <form onSubmit={handleSubscribe} className="d-grid gap-2">
              <input
                className="lux-footer__newsletterInput"
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={newsletterLoading}
                required
              />
              <button type="submit" className="btn btn-primary">
                {newsletterLoading ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 10 }}>
              No spam. Unsubscribe anytime.
            </div>
          </div>
        </div>

        <div className="lux-footer__bottom">
          <div>© {new Date().getFullYear()} Caliber Watch. All rights reserved.</div>
          <div className="lux-footer__meta">
            <span>Encrypted checkout</span>
            <span>•</span>
            <span>Insured shipping</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
