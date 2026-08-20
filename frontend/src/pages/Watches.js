import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Form } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { watchAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import WatchCardMedia from '../components/WatchCardMedia';
import { formatCurrencyINR } from '../utils/currency';

import './Home.css';

function Watches() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(0);
  const [priceCeiling, setPriceCeiling] = useState(0);

  const searchParam = useMemo(() => {
    const q = new URLSearchParams(location.search).get('search') || '';
    return q.trim();
  }, [location.search]);

  useEffect(() => {
    setSearchQuery(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await watchAPI.getAllWatches();
        const list = Array.isArray(response.data) ? response.data : [];
        setWatches(list);

        const computedMax = list.reduce((m, w) => Math.max(m, Number(w?.price || 0)), 0);
        setPriceCeiling(computedMax || 0);
        setMaxPrice(computedMax || 0);
      } catch {
        Swal.fire('Error', 'Failed to load watches', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set((watches || []).map((w) => String(w?.category || '').trim()).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [watches]);

  const filteredWatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return (watches || []).filter((w) => {
      const categoryOk = selectedCategory === 'All' || String(w?.category || '') === selectedCategory;
      const priceOk = maxPrice <= 0 || Number(w?.price || 0) <= maxPrice;
      const searchOk =
        !q ||
        `${w?.title || ''} ${w?.description || ''} ${w?.brand || ''} ${w?.category || ''}`.toLowerCase().includes(q);
      return categoryOk && priceOk && searchOk;
    });
  }, [watches, selectedCategory, searchQuery, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      navigate('/watches');
      return;
    }
    navigate(`/watches?search=${encodeURIComponent(q)}`);
  };

  const isWishlisted = (watchId) => {
    try {
      const list = JSON.parse(localStorage.getItem('wishlist')) || [];
      return Array.isArray(list) && list.some((w) => w && w._id === watchId);
    } catch {
      return false;
    }
  };

  const toggleWishlist = (watch) => {
    if (authLoading) return;
    if (!user) {
      Swal.fire('Login required', 'Please login to use wishlist', 'info').then(() => navigate('/login'));
      return;
    }

    try {
      const list = JSON.parse(localStorage.getItem('wishlist')) || [];
      const next = Array.isArray(list) ? [...list] : [];
      const idx = next.findIndex((w) => w && w._id === watch._id);

      if (idx >= 0) {
        next.splice(idx, 1);
        localStorage.setItem('wishlist', JSON.stringify(next));
        Swal.fire({ icon: 'success', title: 'Removed', text: 'Removed from wishlist', timer: 1200, showConfirmButton: false });
      } else {
        next.unshift(watch);
        localStorage.setItem('wishlist', JSON.stringify(next));
        Swal.fire({ icon: 'success', title: 'Saved', text: 'Added to wishlist', timer: 1200, showConfirmButton: false });
      }
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch {
      Swal.fire('Error', 'Wishlist update failed', 'error');
    }
  };

  const addToCart = (watch) => {
    if (authLoading) return;
    if (!user) {
      Swal.fire('Login required', 'Please login to add products to cart', 'info').then(() => {
        navigate('/login');
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find((item) => item._id === watch._id);

    if (existingItem) existingItem.quantity += 1;
    else cart.push({ ...watch, quantity: 1 });

    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartCount', cart.reduce((sum, item) => sum + item.quantity, 0));
    window.dispatchEvent(new Event('cartUpdated'));

    Swal.fire({
      icon: 'success',
      title: 'Added to Cart',
      text: `${watch.title} added successfully`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const buyNow = (watch) => {
    if (authLoading) return;
    if (!user) {
      Swal.fire('Login required', 'Please login to continue', 'info').then(() => {
        navigate('/login');
      });
      return;
    }

    const payload = { watch, quantity: 1 };
    sessionStorage.setItem('buyNow', JSON.stringify(payload));
    navigate('/checkout', { state: { buyNow: payload } });
  };

  return (
    <div className="lux-page">
      <section className="lux-section" style={{ paddingTop: 128, paddingBottom: 52 }}>
        <Container>
          <div className="lux-sectionHeader" style={{ marginBottom: 28 }}>
            <div className="lux-overline">Curated Collection</div>
            <h1 className="lux-sectionTitle" style={{ fontSize: '2.9rem' }}>
              Our <span className="lux-text-gold-gradient">Watches</span>
            </h1>
            <p className="lux-sectionSub">Discover timepieces crafted for precision and presence.</p>
          </div>

          <div className="lux-glass p-4 mb-4">
            <Row className="g-3 align-items-end">
              <Col lg={5}>
                <div className="lux-overline" style={{ marginBottom: 10, letterSpacing: '0.32em' }}>
                  Search
                </div>
                <Form onSubmit={handleSearchSubmit}>
                  <Form.Control
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, brand, or category..."
                  />
                </Form>
              </Col>
              <Col lg={4}>
                <div className="lux-overline" style={{ marginBottom: 10, letterSpacing: '0.32em' }}>
                  Category
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`lux-chip ${selectedCategory === cat ? 'lux-chip--active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </Col>
              <Col lg={3}>
                <div className="lux-overline" style={{ marginBottom: 10, letterSpacing: '0.32em' }}>
                  Max Price
                </div>
                <Form.Range
                  className="lux-range"
                  min="0"
                  max={priceCeiling || 0}
                  step={1000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value || 0))}
                />
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
                  Showing up to {formatCurrencyINR(maxPrice || 0)}
                </div>
              </Col>
            </Row>
          </div>

          <div className="d-flex align-items-center justify-content-between mb-3">
            <div style={{ color: 'var(--text-muted)' }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{filteredWatches.length}</span>{' '}
              of <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{watches.length}</span>
            </div>
            <Link to="/cart" className="lux-linkButton" style={{ padding: 0 }}>
              Go to Cart →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>Loading watches...</div>
            </div>
          ) : filteredWatches.length > 0 ? (
            <Row className="g-4">
              {filteredWatches.map((watch) => (
                <Col md={6} lg={4} key={watch._id}>
                  <Card className="lux-productCard">
                    <div className="lux-productCard__imageWrap">
                      <div className="lux-productCard__pill">{watch.brand || 'Caliber'}</div>
                      <div className="lux-productCard__actions">
                        <button
                          type="button"
                          className={`lux-iconBtn ${isWishlisted(watch._id) ? 'lux-iconBtn--wishActive' : ''}`}
                          onClick={() => toggleWishlist(watch)}
                          aria-label={isWishlisted(watch._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                          title={isWishlisted(watch._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          ♥
                        </button>
                        <button
                          type="button"
                          className="lux-iconBtn lux-iconBtn--gold"
                          onClick={() => addToCart(watch)}
                          aria-label="Add to cart"
                          title="Add to cart"
                        >
                          👜
                        </button>
                      </div>
                      <WatchCardMedia watch={watch} className="lux-productCard__img" alt={watch.title} />
                      <div className="lux-productCard__overlay">
                        <Link
                          to={`/watch/${watch._id}`}
                          state={{ from: `${location.pathname}${location.search}` }}
                          className="btn btn-outline-primary"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                    <Card.Body>
                      <div className="lux-overline" style={{ letterSpacing: '0.32em', marginBottom: 10 }}>
                        {watch.category || 'Collection'}
                      </div>
                      <div className="lux-productCard__title">{watch.title}</div>
                      <div className="lux-productCard__desc">{watch.description}</div>
                      <div className="lux-productCard__price">{formatCurrencyINR(watch.price)}</div>
                      <div className="d-grid gap-2 mt-3">
                        <Button onClick={() => addToCart(watch)}>Add to Cart</Button>
                        <Button variant="outline-primary" onClick={() => buyNow(watch)}>
                          Buy Now
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <h4 style={{ color: 'var(--text-primary)' }}>No watches found</h4>
              <p>Try adjusting your search or filters.</p>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                    navigate('/watches');
                  }}
                >
                  Reset Filters
                </Button>
                <Link to="/brands" className="btn btn-outline-primary">
                  Browse Brands
                </Link>
              </div>
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}

export default Watches;
