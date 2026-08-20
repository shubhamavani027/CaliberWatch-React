import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { AuthContext } from '../context/AuthContext';
import { contactAPI } from '../services/api';

import './Contact.css';

const getNameParts = (fullName) => {
  const name = String(fullName || '').trim();
  if (!name) {
    return { firstName: '', lastName: '' };
  }

  const parts = name.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

function Contact() {
  const { user } = useContext(AuthContext);

  const nameParts = useMemo(() => getNameParts(user?.name), [user?.name]);
  const [form, setForm] = useState({
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setForm((current) => ({
      ...current,
      firstName: current.firstName || nameParts.firstName,
      lastName: current.lastName || nameParts.lastName,
      email: current.email || user?.email || '',
      phone: current.phone || user?.phone || '',
    }));
  }, [nameParts.firstName, nameParts.lastName, user?.email, user?.phone]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        subject: 'Contact page inquiry',
        message: form.message.trim(),
      };

      const response = await contactAPI.submit(payload);
      setSuccessMessage(response.data?.message || 'Your message has been stored successfully.');
      setForm((current) => ({ ...current, message: '' }));
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Unable to send your message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__bg" aria-hidden="true" />
        <Container className="contact-hero__container">
          <div className="contact-hero__panel">
            <p className="contact-hero__kicker">Client Services</p>
            <h1 className="contact-hero__title">Contact Us</h1>
            <p className="contact-hero__subtitle">
              Reach the Caliber team for product guidance, after-sales support, and private viewing requests.
            </p>
            <div className="contact-hero__actions">
              <a href="#contact-form" className="contact-pillButton contact-pillButton--ghost">
                Contact Caliber
              </a>
              <Link to="/watches" className="contact-pillButton contact-pillButton--solid">
                Shop Watches
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="contact-layout">
        <Container>
          <div className="contact-layout__grid">
            <div className="contact-location">
              <div className="contact-mapCard">
                <iframe
                  title="Caliber contact location"
                  src="https://www.google.com/maps?q=Sri%20Nath%20Dwar%20Society%2C%20SitaNagar%2C%20Punagam%2C%20Varachha%2C%20Surat%2C%20Gujarat%20395010%2C%20India&z=16&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                <div className="contact-mapCard__badge">
                  <div>
                    <p className="contact-mapCard__title">Sri Nath Dwar Society</p>
                    <p className="contact-mapCard__text">
                      Sri Nath Dwar Society, 108, Seeta Nagar Rd, Sri Nathjidvar Society, Geeta Nagar, Punagam,
                      Varachha, Surat, Gujarat 395011, India
                    </p>
                    <p className="contact-mapCard__meta">No reviews</p>
                  </div>
                  <a
                    href="https://maps.app.goo.gl/Wqjc7ZF2Bo45wwQP9"
                    target="_blank"
                    rel="noreferrer"
                    className="contact-mapCard__link"
                    aria-label="Open location in Google Maps"
                  >
                    <span aria-hidden="true">Open</span>
                  </a>
                </div>
              </div>

              <div className="contact-infoCards">
                <article className="contact-infoCard">
                  <p className="contact-infoCard__label">Address</p>
                  <p className="contact-infoCard__value">
                    Sri Nath Dwar Society, SitaNagar, Punagam, Varachha, Surat, Gujarat 395010, India
                  </p>
                </article>
                <article className="contact-infoCard">
                  <p className="contact-infoCard__label">Mobile</p>
                  <p className="contact-infoCard__value">+91 63597 81054</p>
                </article>
                <article className="contact-infoCard">
                  <p className="contact-infoCard__label">Email</p>
                  <p className="contact-infoCard__value">caliberwatch@store.com</p>
                </article>
              </div>
            </div>

            <form id="contact-form" className="contact-formPanel" onSubmit={handleSubmit}>
              <h2 className="contact-formPanel__title">Our Contact Details</h2>

              <div className="contact-formGrid">
                <label className="contact-formGrid__label" htmlFor="firstName">
                  <span>First Name:</span>
                  <small>Put your name here</small>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />

                <label className="contact-formGrid__label" htmlFor="lastName">
                  <span>Last Name:</span>
                  <small>Put your surname here</small>
                </label>
                <input id="lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} />

                <label className="contact-formGrid__label" htmlFor="phone">
                  <span>Mobile:</span>
                  <small>Put your mobile number here</small>
                </label>
                <input id="phone" name="phone" type="text" value={form.phone} onChange={handleChange} />

                <label className="contact-formGrid__label" htmlFor="email">
                  <span>E-mail:</span>
                  <small>Type email address</small>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <label className="contact-formGrid__label contact-formGrid__label--top" htmlFor="message">
                  <span>Message:</span>
                  <small>Type your message</small>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="7"
                  value={form.message}
                  onChange={handleChange}
                  required
                />
              </div>

              {errorMessage ? <div className="contact-formPanel__alert contact-formPanel__alert--error">{errorMessage}</div> : null}
              {successMessage ? (
                <div className="contact-formPanel__alert contact-formPanel__alert--success">{successMessage}</div>
              ) : null}

              <button type="submit" className="contact-submitButton" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default Contact;
