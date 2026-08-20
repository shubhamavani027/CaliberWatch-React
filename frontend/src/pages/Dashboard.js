import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { orderAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrencyINR } from '../utils/currency';

import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getUserOrders();
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch {
      Swal.fire('Error', 'Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="lux-page">
        <Container className="text-center" style={{ paddingTop: 140, paddingBottom: 80 }}>
          <Spinner animation="border" />
        </Container>
      </div>
    );
  }

  const cancelWindowMinutes = Number(process.env.REACT_APP_ORDER_CANCEL_WINDOW_MINUTES) || 30;
  const canCancelOrder = (order) => {
    if (!order?.createdAt) return false;
    if (order.status !== 'Pending' && order.status !== 'Processing') return false;
    const ageMs = Date.now() - new Date(order.createdAt).getTime();
    return ageMs <= cancelWindowMinutes * 60 * 1000;
  };

  const getCancelTimeLeftText = (order) => {
    if (!order?.createdAt) return '';
    const leftMs = cancelWindowMinutes * 60 * 1000 - (Date.now() - new Date(order.createdAt).getTime());
    const leftMin = Math.max(0, Math.ceil(leftMs / 60000));
    return leftMin > 0 ? `${leftMin} min left` : 'expired';
  };

  const handleCancel = async (order) => {
    const result = await Swal.fire({
      title: 'Cancel order?',
      text: `You can cancel within ${cancelWindowMinutes} minutes of placing the order.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel',
    });
    if (!result.isConfirmed) return;

    try {
      await orderAPI.cancelOrder(order._id, { reason: 'Customer requested cancellation' });
      await Swal.fire('Cancelled', 'Your order has been cancelled.', 'success');
      fetchOrders();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel order';
      Swal.fire('Error', message, 'error');
    }
  };

  const downloadReceipt = async (order) => {
    try {
      const res = await orderAPI.downloadReceipt(order._id);
      const blob = new Blob([res.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const base = order.receiptNumber || `receipt-${order._id?.slice?.(0, 6) || 'order'}`;
      const safeName = String(base).replace(/[^a-z0-9-_]/gi, '_');
      a.href = url;
      a.download = `${safeName}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to download receipt';
      Swal.fire('Error', message, 'error');
    }
  };

  const viewReceipt = async (order) => {
    try {
      setReceiptOrder(order);
      setReceiptHtml('');
      setReceiptLoading(true);
      setShowReceipt(true);

      const res = await orderAPI.getReceiptHtml(order._id);
      const html = typeof res.data === 'string' ? res.data : '';
      setReceiptHtml(html);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load receipt';
      Swal.fire('Error', message, 'error');
      setShowReceipt(false);
    } finally {
      setReceiptLoading(false);
    }
  };

  const statusPillClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('complete')) return 'dash-badge dash-badge--gold';
    if (s.includes('cancel')) return 'dash-badge dash-badge--red';
    if (s.includes('ship')) return 'dash-badge dash-badge--purple';
    if (s.includes('process')) return 'dash-badge dash-badge--blue';
    return 'dash-badge';
  };

  return (
    <div className="lux-page">
      <Container className="dash-shell">
        <Row className="mb-4">
          <Col md={8}>
            <div className="dash-kicker">Account</div>
            <h2 className="dash-title">My Dashboard</h2>
            <p className="dash-sub">Welcome, {user?.name || 'Customer'}</p>
          </Col>
          <Col md={4} className="dash-headerActions">
            <Button variant="outline-primary" className="dash-backBtn" onClick={() => navigate(-1)}>
              Back
            </Button>
          </Col>
        </Row>

        <Row>
          <Col>
            <Card className="dash-panel">
              <Card.Header className="dash-panel__head">
                <Card.Title className="dash-panel__title">My Orders</Card.Title>
              </Card.Header>
              <Card.Body>
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="dash-empty">No orders yet.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <Table className="dash-table" responsive>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id}>
                            <td>{String(order._id || '').slice(0, 8) || '—'}</td>
                            <td>{(order.items?.length || 0)} item(s)</td>
                            <td>{formatCurrencyINR(order.total)}</td>
                            <td>
                              <span className={statusPillClass(order.status)}>{order.status || 'Processing'}</span>
                            </td>
                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td>
                              {canCancelOrder(order) ? (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleCancel(order)}
                                  title={`Cancel available: ${getCancelTimeLeftText(order)}`}
                                >
                                  Cancel
                                </Button>
                              ) : (
                                <span className="dash-muted" title={getCancelTimeLeftText(order)}>
                                  —
                                </span>
                              )}
                            </td>
                            <td>
                              {order.payment?.status === 'Paid' && order.status !== 'Cancelled' ? (
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                  <Button variant="outline-primary" size="sm" onClick={() => viewReceipt(order)}>
                                    View
                                  </Button>
                                  <Button variant="outline-secondary" size="sm" onClick={() => downloadReceipt(order)}>
                                    Download
                                  </Button>
                                </div>
                              ) : (
                                <span className="dash-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal
        show={showReceipt}
        onHide={() => setShowReceipt(false)}
        centered
        size="lg"
        dialogClassName="dash-receiptModal"
        contentClassName="dash-receiptModal__content"
      >
        <Modal.Header closeButton>
          <Modal.Title style={{ fontFamily: 'var(--font-display)', fontWeight: 900 }}>
            Receipt {receiptOrder?.receiptNumber ? `(${receiptOrder.receiptNumber})` : ''}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          {receiptLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : receiptHtml ? (
            <iframe title="Receipt preview" className="dash-receiptFrame" srcDoc={receiptHtml} />
          ) : (
            <div className="dash-muted" style={{ padding: 16 }}>
              No receipt preview available.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setShowReceipt(false)}>
            Close
          </Button>
          {receiptOrder?.payment?.status === 'Paid' && receiptOrder?.status !== 'Cancelled' && (
            <Button variant="primary" onClick={() => downloadReceipt(receiptOrder)}>
              Download
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Dashboard;
