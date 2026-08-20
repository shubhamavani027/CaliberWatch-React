import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Card, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrencyINR } from '../utils/currency';
import './AdminDashboard.css';

const COLORS = ['#D6B24A', '#E0A084', '#a07d35', '#b34d4d', '#F4A582'];

function Analytics() {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !admin) navigate('/admin');
  }, [admin, authLoading, navigate]);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getAnalytics();
        setAnalytics(response.data);
      } catch (error) {
        Swal.fire('Error', 'Failed to load analytics', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && admin) {
      loadAnalytics();
    }
  }, [admin, authLoading]);

  const statusData = useMemo(() => {
    const source = analytics?.ordersByStatus || {};
    return Object.entries(source).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: Number(count || 0),
    }));
  }, [analytics]);

  const monthlyCombinedData = useMemo(() => {
    const orderSrc = analytics?.monthlyOrderData || {};
    const revSrc = analytics?.monthlyRevenueData || {};
    const userSrc = analytics?.userGrowthData || {};

    const months = new Set([...Object.keys(orderSrc), ...Object.keys(revSrc), ...Object.keys(userSrc)]);

    return Array.from(months)
      .sort((a, b) => a.localeCompare(b))
      .map((month) => {
        const [year, m] = month.split('-');
        const date = new Date(year, parseInt(m) - 1);
        const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        return {
          rawMonth: month,
          month: monthName,
          orders: Number(orderSrc[month] || 0),
          revenue: Number(revSrc[month] || 0),
          users: Number(userSrc[month] || 0),
        };
      });
  }, [analytics]);

  if (authLoading || loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Spinner animation="border" className="spinner-custom" />
      </Container>
    );
  }

  if (!analytics) {
    return (
      <div className="admin-dashboard">
        <Container fluid className="admin-container">
          <h2>Sales Analytics</h2>
          <Card className="dashboard-card">
            <Card.Body style={{ color: 'rgba(255,255,255,0.70)' }}>
              Unable to load analytics data. Please try again.
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'rgba(10, 10, 10, 0.95)', border: '1px solid rgba(214, 178, 74, 0.3)', padding: '15px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <p style={{ margin: '0 0 10px', fontWeight: 'bold', color: '#fff' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ margin: '5px 0', color: entry.color, fontWeight: '600' }}>
              {entry.name}: {entry.name.toLowerCase().includes('revenue') ? formatCurrencyINR(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="admin-dashboard">
      <Container fluid className="admin-container">
        <h2 className="mb-4">Live Analytics Dashboard</h2>

        <Row className="g-4 mb-5">
          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header><b>Total Users</b></Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value">{analytics.totalUsers}</div>
                <div className="dashboard-stat-label">Registered users</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header><b>Total Orders</b></Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value">{analytics.totalOrders}</div>
                <div className="dashboard-stat-label">All orders</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header><b>Total Revenue</b></Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value" style={{ fontSize: '2.5rem' }}>{formatCurrencyINR(analytics.totalRevenue)}</div>
                <div className="dashboard-stat-label">All time</div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card className="dashboard-card">
              <Card.Header><b>Avg Order Value</b></Card.Header>
              <Card.Body className="dashboard-stat-body">
                <div className="dashboard-stat-value" style={{ fontSize: '2.5rem' }}>{formatCurrencyINR(analytics.avgOrderValue)}</div>
                <div className="dashboard-stat-label">Per order</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Revenue Trends Chart */}
        <Row className="g-4 mb-4">
          <Col xs={12}>
            <Card className="dashboard-card">
              <Card.Header><b>Revenue & Growth Trends</b></Card.Header>
              <Card.Body>
                {monthlyCombinedData.length > 0 ? (
                  <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                      <AreaChart data={monthlyCombinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D6B24A" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#D6B24A" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)'}} />
                        <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.7)'}} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="revenue" name="Revenue Over Time" stroke="#D6B24A" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div style={{ color: 'rgba(255,255,255,0.70)' }}>No revenue data available</div>}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* KPI Bar Chart */}
          <Col lg={7}>
            <Card className="dashboard-card h-100">
              <Card.Header><b>Monthly Orders & Signups</b></Card.Header>
              <Card.Body>
                {monthlyCombinedData.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <BarChart data={monthlyCombinedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                        <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
                        <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar yAxisId="left" dataKey="orders" name="Total Orders" fill="#D6B24A" radius={[6, 6, 0, 0]} barSize={40} />
                        <Bar yAxisId="right" dataKey="users" name="New User Signups" fill="#E0A084" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div style={{ color: 'rgba(255,255,255,0.70)' }}>No monthly data available</div>}
              </Card.Body>
            </Card>
          </Col>

          {/* Status Distribution Pie Chart */}
          <Col lg={5}>
            <Card className="dashboard-card h-100">
              <Card.Header><b>Order Status Distribution</b></Card.Header>
              <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                {statusData.length > 0 ? (
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <div style={{ color: 'rgba(255,255,255,0.70)' }}>No order data available</div>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Analytics;
