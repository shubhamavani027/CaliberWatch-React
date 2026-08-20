import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { watchAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import WatchCardMedia from '../components/WatchCardMedia';
import { formatCurrencyINR } from '../utils/currency';

import './Home.css';

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await watchAPI.getAllWatches();
        setWatches(Array.isArray(response.data) ? response.data : []);
      } catch {
        Swal.fire('Error', 'Failed to load watches', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (location.hash === '#products') {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const searchTerm = useMemo(() => {
    const q = new URLSearchParams(location.search).get('search') || '';
    return q.trim();
  }, [location.search]);

  const filteredWatches = useMemo(() => {
    if (!searchTerm) return watches;
    const q = searchTerm.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);
    const qCompact = q.replace(/\s+/g, '');

    return (watches || []).filter((w) => {
      const title = String(w?.title || '');
      const description = String(w?.description || '');
      const category = String(w?.category || '');
      const brand = String(w?.brand || '');

      const haystack = `${title} ${description} ${category} ${brand}`.toLowerCase();
      const haystackCompact = haystack.replace(/\s+/g, '');

      if (qCompact && haystackCompact.includes(qCompact)) return true;
      if (tokens.length === 0) return true;
      return tokens.every((t) => haystack.includes(t));
    });
  }, [watches, searchTerm]);

  const featured = useMemo(() => filteredWatches.slice(0, 6), [filteredWatches]);

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
      {/* Hero */}
      <section className="lux-hero">
        <video className="lux-hero__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/images/homebg.mp4" type="video/mp4" />
        </video>
        <div className="lux-hero__bg" aria-hidden="true" />
        <Container className="lux-hero__container">
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <div className="lux-overline">Caliber Watch Store</div>
              <h1 className="lux-hero__title">
                Redefining <br />
                <span className="lux-text-gold-gradient">Luxury Time.</span>
              </h1>
              <p className="lux-hero__subtitle">
                Discover a curated collection of premium timepieces built for precision, comfort, and confidence.
              </p>

              <div className="d-flex flex-wrap gap-3 pt-2">
                <Link to="/watches" className="btn btn-primary">
                  Explore Collection
                </Link>
                <Link to="/brands" className="btn btn-outline-primary">
                  View Brands
                </Link>
                <Button
                  variant="link"
                  className="lux-linkButton"
                  onClick={() => {
                    const el = document.getElementById('products');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    else navigate('/#products');
                  }}
                >
                  Featured →
                </Button>
              </div>

              <div className="lux-stats">
                <div className="lux-stat">
                  <div className="lux-stat__value">5,000+</div>
                  <div className="lux-stat__label">Curated Pieces</div>
                </div>
                <div className="lux-stat">
                  <div className="lux-stat__value">45+</div>
                  <div className="lux-stat__label">Trusted Brands</div>
                </div>
                <div className="lux-stat">
                  <div className="lux-stat__value">12k+</div>
                  <div className="lux-stat__label">Happy Clients</div>
                </div>
                <div className="lux-stat">
                  <div className="lux-stat__value">14</div>
                  <div className="lux-stat__label">Years of Craft</div>
                </div>
              </div>
            </Col>

            <Col lg={6}>
              
            </Col>
          </Row>
        </Container>
      </section>

      {/* Trust */}
      <section className="lux-trust">
        <Container>
          <Row className="g-4">
            <Col md={4}>
              <div className="lux-trustCard">
                <div className="lux-trustCard__icon">✓</div>
                <div>
                  <div className="lux-trustCard__title">Authenticity First</div>
                  <div className="lux-trustCard__text">
                    Transparent listings and clear details so you can shop confidently.
                  </div>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="lux-trustCard">
                <div className="lux-trustCard__icon">↯</div>
                <div>
                  <div className="lux-trustCard__title">Insured Shipping</div>
                  <div className="lux-trustCard__text">Fast, protected delivery—built for peace of mind.</div>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="lux-trustCard">
                <div className="lux-trustCard__icon">★</div>
                <div>
                  <div className="lux-trustCard__title">Premium Support</div>
                  <div className="lux-trustCard__text">From selection to service, we’re with you after checkout.</div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured */}
      <section className="lux-section" id="products">
        <Container>
          <div className="lux-sectionHeader">
            <div className="lux-overline text-center">Curated Collection</div>
            <h2 className="lux-sectionTitle">
              Featured <span className="lux-text-gold-gradient">Watches</span>
            </h2>
            <p className="lux-sectionSub">
              Explore signature styles—then refine by category and price inside the full collection.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div style={{ marginTop: 10, color: 'var(--text-muted)' }}>Loading watches…</div>
            </div>
          ) : featured.length > 0 ? (
            <Row className="g-4">
              {featured.map((watch) => (
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
                          state={{ from: `${location.pathname}${location.search}${location.hash || ''}` }}
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
              <p>{searchTerm ? 'Try a different search term.' : 'No products available.'}</p>
            </div>
          )}

          <div className="text-center mt-5">
            <Link to="/watches" className="btn btn-primary">
              Browse All Watches
            </Link>
          </div>
        </Container>
      </section>

      {/* Collections */}
      <section className="lux-section lux-collections">
        <Container>
          <div className="lux-sectionHeader">
            <div className="lux-overline text-center">Collections</div>
            <h2 className="lux-sectionTitle">
              Curated <span className="lux-text-gold-gradient">Series</span>
            </h2>
          </div>

          <Row className="g-4">
            <Col md={6}>
              <Link to="/watches" className="lux-collectionCard">
                <img src="/assets/collection-silver.png" alt="Minimalist Series" />
                <div className="lux-collectionCard__shade" aria-hidden="true" />
                <div className="lux-collectionCard__content">
                  <div className="lux-collectionCard__title">The Minimalist Series</div>
                  <div className="lux-collectionCard__sub">Elegant Silver &amp; Steel</div>
                  <div className="lux-collectionCard__cta">View Collection →</div>
                </div>
              </Link>
            </Col>
            <Col md={6}>
              <Link to="/watches" className="lux-collectionCard">
                <img src="/assets/collection-gold.png" alt="Royal Edition" />
                <div className="lux-collectionCard__shade" aria-hidden="true" />
                <div className="lux-collectionCard__content">
                  <div className="lux-collectionCard__title">The Royal Edition</div>
                  <div className="lux-collectionCard__sub">Timeless Gold &amp; Leather</div>
                  <div className="lux-collectionCard__cta">View Collection →</div>
                </div>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA */}
      <section className="lux-cta">
        <video className="lux-cta__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/images/homebottom.mp4" type="video/mp4" />
        </video>
        <div className="lux-cta__bg" aria-hidden="true" />
        <Container className="text-center">
          <h2 className="lux-cta__title">
            Start your legacy with <span className="lux-text-gold-gradient">Caliber</span>.
          </h2>
          <p className="lux-cta__text">
            From iconic classics to modern sport pieces—discover watches curated for craft, comfort, and confidence.
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/watches" className="btn btn-primary">
              Explore The Collection
            </Link>
            <Link to="/about" className="btn btn-outline-primary">
              Learn More
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default Home;
