import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Form, Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { orderAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrencyINR } from '../utils/currency';

import './AdminDashboard.css';

function OrderPage() {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useContext(AuthContext);

  const STATUS_OPTIONS = useMemo(() => ['Pending', 'Processing', 'Shipped', 'Delivered'], []);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  const refreshOrders = async () => {
    const orderRes = await orderAPI.getAllOrders();
    setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshOrders();
    } catch {
      Swal.fire('Error', 'Failed to refresh orders', 'error');
    } finally {
      setRefreshing(false);
    }
  };

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
        await refreshOrders();
      } catch {
        Swal.fire('Error', 'Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [admin, authLoading, navigate]);

  useEffect(() => {
    if (authLoading || !admin) return;

    const id = setInterval(() => {
      refreshOrders().catch(() => {});
    }, 60000);

    return () => clearInterval(id);
  }, [admin, authLoading]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !q || [order.fullName, order.userEmail, order._id].some((v) => String(v || '').toLowerCase().includes(q));
      const matchesStatus = orderStatusFilter === 'All' || order.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const handleStatusChange = async (id, status) => {
    const current = orders.find((o) => o._id === id);
    if (current?.status === 'Delivered') {
      Swal.fire('Locked', 'Delivered orders cannot be changed.', 'info');
      return;
    }
    if (current?.status === 'Cancelled') {
      Swal.fire('Locked', 'Cancelled orders cannot be changed.', 'info');
      return;
    }
    try {
      await orderAPI.updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
      Swal.fire('Success', 'Status updated', 'success');
    } catch (e) {
      const message = e?.response?.data?.message || 'Update failed';
      Swal.fire('Error', message, 'error');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-dashboard">
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Spinner />
        </Container>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container fluid className="admin-container">
        <h2>Orders</h2>

        <Card className="dashboard-card orders">
          <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <b>Orders ({filteredOrders.length})</b>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <Button size="sm" variant="outline-light" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Form.Control
                size="sm"
                className="search-input"
                placeholder="Search orders..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
              <Form.Select
                size="sm"
                className="status-select"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Form.Select>
            </div>
          </Card.Header>

          <Card.Body>
            <Table hover size="sm" responsive className="dashboard-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o._id}>
                    <td>{String(o._id || '').slice(0, 6)}</td>
                    <td>{o.fullName}</td>
                    <td>{formatCurrencyINR(o.total || 0)}</td>
                    <td style={{ minWidth: 160 }}>
                      <Form.Select
                        size="sm"
                        className={`status-select ${
                          o.status === 'Delivered'
                            ? 'status-select--delivered'
                            : o.status === 'Cancelled'
                              ? 'status-select--cancelled'
                              : ''
                        }`}
                        value={o.status}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        disabled={o.status === 'Delivered' || o.status === 'Cancelled'}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        {o.status === 'Cancelled' && (
                          <option value="Cancelled">Cancelled</option>
                        )}
                      </Form.Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default OrderPage;

