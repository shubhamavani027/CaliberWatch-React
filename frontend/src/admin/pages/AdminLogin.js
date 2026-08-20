import React, { useEffect, useState, useContext } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { DEFAULT_ADMIN_EMAIL } from '../access';

import './Auth.css';

function AdminLogin() {
  const navigate = useNavigate();
  const { admin, loginAdmin, loading: authLoading } = useContext(AuthContext);
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && admin) navigate('/admin/dashboard');
  }, [admin, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminAPI.login({ email, password });
      loginAdmin(response.data.admin, response.data.token);
      Swal.fire('Success', 'Admin login successful', 'success').then(() => {
        navigate('/admin/dashboard');
      });
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || err.message || 'Login failed';
      const details = err.response?.data?.error;
      const fullMessage = `${status ? `[${status}] ` : ''}${message}${details ? ` (${details})` : ''}`;
      setError(fullMessage);
      Swal.fire('Error', fullMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-page--admin">
      <div className="auth-backdrop" aria-hidden="true">
        <span className="auth-backdrop__ring auth-backdrop__ring--one" />
        <span className="auth-backdrop__ring auth-backdrop__ring--two" />
        <span className="auth-backdrop__grid" />
      </div>

      <div className="auth-layout">
        <section className="auth-showcase">
          <div className="auth-showcase__eyebrow">Caliber Control Room</div>
          <h1 className="auth-showcase__title">Admin access for store operations, order oversight, and catalog control.</h1>
          <p className="auth-showcase__copy">
            This panel is reserved for approved internal admin accounts. Sign in directly with one of the allowed admin
            emails and its password to reach the dashboard.
          </p>
        </section>

        <section className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" aria-hidden="true">A</div>
            <div className="auth-kicker">Restricted entry</div>
            <h2 className="auth-title">Admin Login</h2>
            <p className="auth-sub">Use one of the approved admin emails and its password to continue.</p>
          </div>

          <Card className="auth-panel">
            <Card.Body>
              {authLoading && <Alert variant="info">Checking admin session...</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}



              <Form onSubmit={handleSubmit}>
                <div className="form-group-auth">
                  <Form.Label className="form-label">Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="Enter admin Email"
                    required
                  />
                </div>

                <div className="form-group-auth">
                  <Form.Label className="form-label">Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter admin password"
                    required
                  />
                </div>

                <Button className="btn-rose" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Enter Dashboard'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <div className="auth-footer">
            <p>
              Back to customer site? <Link to="/">Open store</Link>
            </p>
            <p>
              Need customer login instead? <Link to="/login">Go to user login</Link>
            </p>
            <p>
              Already signed in? <Link to="/admin/dashboard">Go to dashboard</Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminLogin;
