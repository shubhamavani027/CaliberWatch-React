import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { watchAPI, orderAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrencyINR } from '../utils/currency';

import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    watchCount: 0,
    orderCount: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!admin) {
      navigate('/admin');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [watchRes, orderRes] = await Promise.all([watchAPI.getAllWatches(), orderAPI.getAllOrders()]);

        const watches = Array.isArray(watchRes.data) ? watchRes.data : [];
        const orders = Array.isArray(orderRes.data) ? orderRes.data : [];

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || order.total || 0), 0);
        const pendingOrders = orders.filter((order) => {
          const s = String(order.status || '').toLowerCase();
          return s === 'pending' || s === 'processing';
        }).length;

        setStats({
          watchCount: watches.length,
          orderCount: orders.length,
          totalRevenue,
          pendingOrders,
        });
      } catch {
        Swal.fire('Error', 'Failed to load dashboard counts', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [admin, authLoading, navigate]);

  const quickActions = useMemo(
    () => [
      {
        icon: '➕',
        title: 'Add New Watch',
        sub: 'Create a new watch listing',
        onClick: () => navigate('/admin/watches'),
        cta: 'Add Now',
      },
      {
        icon: '👥',
        title: 'Users',
        sub: 'Manage user accounts',
        onClick: () => navigate('/admin/users'),
        cta: 'View All',
      },
      {
        icon: '📊',
        title: 'Analytics',
        sub: 'View sales analytics',
        onClick: () => navigate('/admin/analytics'),
        cta: 'View',
      },
      {
        icon: '⚙️',
        title: 'Settings',
        sub: 'Configure app settings',
        onClick: () => navigate('/admin/settings'),
        cta: 'Configure',
      },
    ],
    [navigate]
  );

  if (authLoading || loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" className="spinner-custom" />
      </Container>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container fluid className="admin-container">
        <h2>Admin Dashboard</h2>

        <Row className="g-4 mb-5">
          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header>
                <b>⌚ Watches</b>
              </Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value">{stats.watchCount}</div>
                <div className="dashboard-stat-label">Total watches</div>
                <Button className="dashboard-stat-btn" onClick={() => navigate('/admin/watches')}>
                  Manage
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header>
                <b>📦 Orders</b>
              </Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value">{stats.orderCount}</div>
                <div className="dashboard-stat-label">Total orders</div>
                <Button className="dashboard-stat-btn" onClick={() => navigate('/admin/order')}>
                  View
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header>
                <b>💰 Revenue</b>
              </Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value" style={{ fontSize: '3rem' }}>
                  {formatCurrencyINR(stats.totalRevenue)}
                </div>
                <div className="dashboard-stat-label">Total revenue</div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header>
                <b>⏳ Pending</b>
              </Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value" style={{ color: 'var(--primary-color)' }}>
                  {stats.pendingOrders}
                </div>
                <div className="dashboard-stat-label">Orders pending</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <section className="products-section quick-actions" style={{ padding: '40px 0' }}>
          <h3 className="section-title mb-4">Quick Actions</h3>
          <Row className="g-3">
            {quickActions.map((a) => (
              <Col key={a.title} md={6} lg={3}>
                <Card className="dashboard-card">
                  <Card.Body className="text-center">
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }} aria-hidden="true">
                      {a.icon}
                    </div>
                    <h5>{a.title}</h5>
                    <p>{a.sub}</p>
                    <Button className="dashboard-stat-btn" onClick={a.onClick}>
                      {a.cta}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>
      </Container>
    </div>
  );
}

export default AdminDashboard;

