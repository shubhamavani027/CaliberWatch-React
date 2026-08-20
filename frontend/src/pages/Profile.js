import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Spinner, Alert, Button, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { AuthContext } from '../context/AuthContext';
import { authAPI, orderAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';

import './Profile.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: 'PR' },
  { id: 'orders', label: 'Orders', icon: 'OR' },
  { id: 'wishlist', label: 'Wishlist', icon: 'WL' },
  { id: 'settings', label: 'Settings', icon: 'ST' },
];

const getInitials = (value) => {
  const cleaned = String(value || '').trim();
  if (!cleaned) return 'C';
  const parts = cleaned
    .replace(/[^a-zA-Z0-9@.\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 1) {
    const single = parts[0];
    if (single.includes('@')) return single.slice(0, 2).toUpperCase();
    return single.slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
};

const statusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('deliver') || normalized.includes('complete')) return 'profile-badge profile-badge--gold';
  if (normalized.includes('ship')) return 'profile-badge profile-badge--purple';
  if (normalized.includes('process')) return 'profile-badge profile-badge--blue';
  if (normalized.includes('cancel')) return 'profile-badge profile-badge--red';
  return 'profile-badge';
};

function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout, updateUser } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState('');
  const [wishlistItems, setWishlistItems] = useState([]);
  const [settings, setSettings] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    notifications: true,
    newsletter: false,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const prefsKey = useMemo(() => (user?.email ? `caliber_prefs_${user.email}` : null), [user?.email]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const loadWishlist = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
      setWishlistItems(Array.isArray(saved) ? saved : []);
    } catch {
      setWishlistItems([]);
    }
  };

  const loadAll = async () => {
    try {
      setError('');
      const [profileRes, ordersRes] = await Promise.allSettled([authAPI.getProfile(), orderAPI.getUserOrders()]);

      setProfile(profileRes.status === 'fulfilled' ? profileRes.value?.data || null : null);
      setOrders(ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value?.data) ? ordersRes.value.data : []);
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load profile';
      setError(message);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAll();
    loadWishlist();
    setSettings((prev) => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
      addressLine1: user?.address?.addressLine1 || '',
      addressLine2: user?.address?.addressLine2 || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zip: user?.address?.zip || '',
      country: user?.address?.country || '',
    }));

    if (!prefsKey) return;
    try {
      const stored = localStorage.getItem(prefsKey);
      if (!stored) return;
      const prefs = JSON.parse(stored);
      setSettings((prev) => ({
        ...prev,
        notifications: typeof prefs.notifications === 'boolean' ? prefs.notifications : prev.notifications,
        newsletter: typeof prefs.newsletter === 'boolean' ? prefs.newsletter : prev.newsletter,
      }));
    } catch {
      // ignore bad local storage content
    }
  }, [user, prefsKey]);

  useEffect(() => {
    if (!profile) return;
    setSettings((prev) => ({
      ...prev,
      name: profile?.name || prev.name,
      phone: profile?.phone || '',
      addressLine1: profile?.address?.addressLine1 || '',
      addressLine2: profile?.address?.addressLine2 || '',
      city: profile?.address?.city || '',
      state: profile?.address?.state || '',
      zip: profile?.address?.zip || '',
      country: profile?.address?.country || '',
    }));
  }, [profile]);

  const wishlistCount = wishlistItems.length;

  const totalSpent = useMemo(
    () => (orders || []).reduce((sum, order) => sum + Number(order?.total || order?.totalPrice || 0), 0),
    [orders]
  );

  const latestOrder = useMemo(() => {
    if (!orders.length) return null;
    return [...orders].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))[0];
  }, [orders]);

  const latestOrderName = useMemo(() => {
    if (!latestOrder) return '';
    const firstItem = Array.isArray(latestOrder.items) ? latestOrder.items[0] : null;
    return (
      firstItem?.title ||
      firstItem?.name ||
      firstItem?.watch?.title ||
      firstItem?.watch?.name ||
      firstItem?.product?.title ||
      firstItem?.product?.name ||
      ''
    );
  }, [latestOrder]);

  const completedOrders = useMemo(
    () =>
      orders.filter((order) => {
        const normalized = String(order?.status || '').toLowerCase();
        return normalized.includes('deliver') || normalized.includes('complete');
      }).length,
    [orders]
  );

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'You will be signed out of your account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Logout',
    });

    if (!result.isConfirmed) return;
    logout();
    navigate('/');
  };

  const removeWishlistItem = (id) => {
    const next = (wishlistItems || []).filter((item) => item?._id !== id);
    setWishlistItems(next);
    localStorage.setItem('wishlist', JSON.stringify(next));
    Swal.fire('Removed', 'Item removed from wishlist', 'success');
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaveMessage('');
    setError('');
    
    try {
      const payload = {
        name: String(settings.name || '').trim(),
        phone: String(settings.phone || '').trim(),
        addressLine1: String(settings.addressLine1 || '').trim(),
        addressLine2: String(settings.addressLine2 || '').trim(),
        city: String(settings.city || '').trim(),
        state: String(settings.state || '').trim(),
        zip: String(settings.zip || '').trim(),
        country: String(settings.country || '').trim(),
      };

      const response = await authAPI.updateProfile(payload);

      const savedUser = response?.data?.user || {};
      updateUser?.(savedUser);
      setProfile((prev) => ({ ...(prev || {}), ...savedUser }));

      if (prefsKey) {
        localStorage.setItem(
          prefsKey,
          JSON.stringify({
            notifications: !!settings.notifications,
            newsletter: !!settings.newsletter,
          })
        );
      }

      setSaveMessage('Settings saved.');
      setTimeout(() => setSaveMessage(''), 2500);
      
      Swal.fire('Success', 'Settings updated successfully', 'success');
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save settings';
      if (err.response?.status === 404) {
        const detail = 'The update endpoint was not found on the server. Please check backend route definitions.';
        setError(detail);
        Swal.fire('Endpoint Not Found', detail, 'error');
      } else {
        setError(`Save failed: ${message}`);
        Swal.fire('Error', message, 'error');
      }
    } finally {
      setSaving(false);
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

  const name = profile?.name || user?.name || 'Member';
  const email = profile?.email || user?.email || '--';
  const memberSince = profile?.createdAt ? formatDate(profile.createdAt) : '--';

  return (
    <div className="lux-page profile-page">
      <Container className="profile-shell">
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="profile-hero">
          <div className="profile-hero__row">
            <div className="profile-hero__identity">
              <div className="profile-avatar">{getInitials(name || email)}</div>
              <div>
                <div className="profile-kicker">Caliber Member</div>
                <div className="profile-name">{name}</div>
                <div className="profile-pill">
                  <span>Email</span>
                  <span className="profile-pill__value">{email}</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <Link to="/watches" className="btn btn-primary">
                Visit Store
              </Link>
              <Button variant="outline-danger" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="profile-statCard">
              <div className="profile-statCard__label">Orders</div>
              <div className="profile-statCard__value">{orders.length}</div>
            </div>
            <div className="profile-statCard">
              <div className="profile-statCard__label">Wishlist</div>
              <div className="profile-statCard__value">{wishlistCount}</div>
            </div>
            <div className="profile-statCard">
              <div className="profile-statCard__label">Total Spent</div>
              <div className="profile-statCard__value">{formatCurrencyINR(totalSpent)}</div>
            </div>
          </div>

          <div className="profile-summaryGrid">
            <div className="profile-summaryCard">
              <div className="profile-summaryCard__label">Member Since</div>
              <div className="profile-summaryCard__value">{memberSince}</div>
              <div className="profile-summaryCard__text">Your account is ready for priority support and order tracking.</div>
            </div>
            <div className="profile-summaryCard">
              <div className="profile-summaryCard__label">Latest Order</div>
              <div className="profile-summaryCard__value">{latestOrder ? latestOrderName || 'Recent order' : 'No orders yet'}</div>
              <div className="profile-summaryCard__text">
                {latestOrder
                  ? `${formatCurrencyINR(latestOrder.total || latestOrder.totalPrice || 0)} • ${formatDate(latestOrder.createdAt || latestOrder.date)}`
                  : 'Browse the collection to place your first order.'}
              </div>
            </div>
            <div className="profile-summaryCard">
              <div className="profile-summaryCard__label">Completed Orders</div>
              <div className="profile-summaryCard__value">{completedOrders}</div>
              <div className="profile-summaryCard__text">A quick snapshot of your delivered or completed purchases.</div>
            </div>
          </div>
        </div>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar__head">
              <div className="profile-sidebar__title">Account</div>
              <div className="profile-sidebar__sub">Manage your profile, orders, wishlist, and preferences.</div>
            </div>
            <div className="profile-tabs">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                const meta =
                  tab.id === 'orders'
                    ? String(orders.length)
                    : tab.id === 'wishlist'
                      ? String(wishlistItems.length)
                      : '';
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`profile-tab ${active ? 'profile-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <div className="profile-tab__icon" aria-hidden="true">
                      {tab.icon}
                    </div>
                    <div className="profile-tab__label">{tab.label}</div>
                    {meta ? <div className="profile-tab__meta">{meta}</div> : null}
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="profile-content">
            {activeTab === 'profile' && (
              <div className="profile-panel">
                <div className="profile-panel__title">Account Overview</div>
                <div className="profile-panel__sub">Keep your details current and move between your key account actions quickly.</div>

                <div className="profile-infoGrid">
                  <div className="profile-infoRow">
                    <div className="profile-infoRow__label">Name</div>
                    <div className="profile-infoRow__value">{name}</div>
                  </div>
                  <div className="profile-infoRow">
                    <div className="profile-infoRow__label">Email</div>
                    <div className="profile-infoRow__value">{email}</div>
                  </div>
                  <div className="profile-infoRow">
                    <div className="profile-infoRow__label">Member Since</div>
                    <div className="profile-infoRow__value">{memberSince}</div>
                  </div>
                  <div className="profile-infoRow">
                    <div className="profile-infoRow__label">Support</div>
                    <div className="profile-infoRow__value">Included with every order</div>
                  </div>
                </div>

                <div className="profile-quickGrid">
                  <button type="button" className="profile-quickCard" onClick={() => setActiveTab('orders')}>
                    <div className="profile-quickCard__title">Track Orders</div>
                    <div className="profile-quickCard__text">Review recent purchases, totals, and delivery progress.</div>
                  </button>
                  <button type="button" className="profile-quickCard" onClick={() => setActiveTab('wishlist')}>
                    <div className="profile-quickCard__title">Open Wishlist</div>
                    <div className="profile-quickCard__text">Pick up from saved watches whenever you are ready.</div>
                  </button>
                  <button type="button" className="profile-quickCard" onClick={() => setActiveTab('settings')}>
                    <div className="profile-quickCard__title">Update Preferences</div>
                    <div className="profile-quickCard__text">Keep your display name and alerts the way you want them.</div>
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-4">
                  <Link to="/watches" className="btn btn-primary">
                    Browse Watches
                  </Link>
                  <Link to="/cart" className="btn btn-outline-primary">
                    Go to Cart
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="profile-panel">
                <div className="profile-panel__title">Orders</div>
                <div className="profile-panel__sub">Track your recent purchases and order status.</div>

                {orders.length === 0 ? (
                  <div className="profile-empty">
                    <div className="profile-empty__title">No orders yet</div>
                    <div className="profile-empty__text">Your future purchases will appear here with totals and status updates.</div>
                    <Link to="/watches" className="btn btn-primary">
                      Browse Watches
                    </Link>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="profile-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id || order.id}>
                            <td>{String(order._id || order.id || '').slice(0, 8) || '--'}</td>
                            <td>{formatCurrencyINR(order.total || order.totalPrice || 0)}</td>
                            <td>
                              <span className={statusClass(order.status)}>{order.status || 'Processing'}</span>
                            </td>
                            <td>{formatDate(order.createdAt || order.date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3">
                      <Link to="/dashboard" className="btn btn-outline-primary">
                        Full Order History
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="profile-panel">
                <div className="profile-panel__title">Wishlist</div>
                <div className="profile-panel__sub">Keep track of watches you love, ready for when you want them.</div>

                {wishlistItems.length === 0 ? (
                  <div className="profile-empty">
                    <div className="profile-empty__title">Your wishlist is empty</div>
                    <div className="profile-empty__text">Save pieces from the collection to compare later and come back faster.</div>
                    <Link to="/watches" className="btn btn-primary">
                      Browse Watches
                    </Link>
                  </div>
                ) : (
                  <div className="row g-3">
                    {wishlistItems.map((item) => (
                      <div key={item._id} className="col-12 col-md-6">
                        <div className="profile-wishlistCard">
                          <div className="profile-wishlistCard__brand">{item.brand || 'Brand'}</div>
                          <div className="profile-wishlistCard__title">{item.title || item.name || 'Watch'}</div>
                          <div className="profile-wishlistCard__price">{formatCurrencyINR(item.price)}</div>
                          <div className="d-flex gap-2 mt-3">
                            <Link to={`/watch/${item._id}`} className="btn btn-outline-primary w-100">
                              View
                            </Link>
                            <Button variant="outline-danger" className="w-100" onClick={() => removeWishlistItem(item._id)}>
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="profile-panel">
                <div className="profile-panel__title">Settings</div>
                <div className="profile-panel__sub">Personalize your Caliber experience.</div>

                <div className="profile-settingsRow">
                  <div>
                    <div className="form-label">Display Name</div>
                    <Form.Control
                      value={settings.name}
                      onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                    />
                    <div className="profile-help mt-2">This updates your name in the current session.</div>
                  </div>

                  <div>
                    <div className="form-label">Phone</div>
                    <Form.Control
                      value={settings.phone}
                      onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <div className="form-label">Address Line 1</div>
                    <Form.Control
                      value={settings.addressLine1}
                      onChange={(e) => setSettings((prev) => ({ ...prev, addressLine1: e.target.value }))}
                      placeholder="Street address"
                    />
                  </div>

                  <div>
                    <div className="form-label">Address Line 2</div>
                    <Form.Control
                      value={settings.addressLine2}
                      onChange={(e) => setSettings((prev) => ({ ...prev, addressLine2: e.target.value }))}
                      placeholder="Apartment, suite, landmark"
                    />
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-label">City</div>
                      <Form.Control
                        value={settings.city}
                        onChange={(e) => setSettings((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                      />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">State</div>
                      <Form.Control
                        value={settings.state}
                        onChange={(e) => setSettings((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                      />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">ZIP Code</div>
                      <Form.Control
                        value={settings.zip}
                        onChange={(e) => setSettings((prev) => ({ ...prev, zip: e.target.value }))}
                        placeholder="ZIP / Postal code"
                      />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">Country</div>
                      <Form.Control
                        value={settings.country}
                        onChange={(e) => setSettings((prev) => ({ ...prev, country: e.target.value }))}
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <Form.Check
                    type="switch"
                    id="pref-notifications"
                    label="Order notifications"
                    checked={!!settings.notifications}
                    onChange={(e) => setSettings((prev) => ({ ...prev, notifications: e.target.checked }))}
                  />

                  <Form.Check
                    type="switch"
                    id="pref-newsletter"
                    label="Newsletter"
                    checked={!!settings.newsletter}
                    onChange={(e) => setSettings((prev) => ({ ...prev, newsletter: e.target.checked }))}
                  />

                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <Button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                    {saveMessage ? <div style={{ color: 'var(--text-secondary)' }}>{saveMessage}</div> : null}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}

export default Profile;
