import React, { useContext, useEffect, useState } from 'react';
import { Container, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './AdminDashboard.css';

function Settings() {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'The Caliber',
    supportEmail: 'support@caliber.com',
    enableNotifications: true,
    autoConfirmOrders: false,
    maintenanceMode: false,
  });

  useEffect(() => {
    if (!authLoading && !admin) navigate('/admin');
  }, [admin, authLoading, navigate]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getSettings();
        setSettings(response.data);
      } catch (error) {
        console.error('Failed to load settings', error);
        Swal.fire('Info', 'Using default settings', 'info');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && admin) {
      loadSettings();
    }
  }, [admin, authLoading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminAPI.updateSettings(settings);
      Swal.fire('Success', 'Settings updated successfully', 'success');
    } catch (error) {
      Swal.fire('Error', 'Failed to save settings', 'error');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" className="spinner-custom" />
      </Container>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container fluid className="admin-container d-flex flex-column align-items-center">
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <h2 className="mb-4 text-center" style={{ width: '100%' }}>App Settings</h2>

          <Card className="dashboard-card w-100">
            <Card.Header>
              <b>⚙️ Configuration</b>
            </Card.Header>
            <Card.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label style={{ color: 'rgba(255,255,255,0.9)' }}>Store Name</Form.Label>
                <Form.Control
                  type="text"
                  name="storeName"
                  value={settings.storeName}
                  onChange={handleChange}
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ color: 'rgba(255,255,255,0.9)' }}>Support Email</Form.Label>
                <Form.Control
                  type="email"
                  name="supportEmail"
                  value={settings.supportEmail}
                  onChange={handleChange}
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  name="enableNotifications"
                  label="Enable Email Notifications"
                  checked={settings.enableNotifications}
                  onChange={handleChange}
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                />
                <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Send order confirmation and status update emails to customers
                </small>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  name="autoConfirmOrders"
                  label="Auto-Confirm Orders"
                  checked={settings.autoConfirmOrders}
                  onChange={handleChange}
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                />
                <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Automatically confirm orders without manual review
                </small>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Check
                  type="checkbox"
                  name="maintenanceMode"
                  label="Maintenance Mode"
                  checked={settings.maintenanceMode}
                  onChange={handleChange}
                  style={{ color: 'rgba(255,255,255,0.9)' }}
                />
                <small style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Disable customer access while performing maintenance
                </small>
              </Form.Group>

              <Button
                variant="warning"
                size="lg"
                onClick={handleSave}
                disabled={saving}
                style={{ marginTop: '1rem' }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
        </div>
      </Container>
    </div>
  );
}

export default Settings;

