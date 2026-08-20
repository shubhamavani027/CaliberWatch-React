import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Accordion, Button, Card, Carousel, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

import { AuthContext } from '../context/AuthContext';
import { watchAPI } from '../services/api';
import { formatCurrencyINR } from '../utils/currency';
import { getPrimaryWatchImage, resolveMediaUrl } from '../utils/media';

import './Home.css';
import './WatchDetail.css';

function WatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [watch, setWatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const fetchWatch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await watchAPI.getWatchById(id);
      setWatch(response.data);
    } catch {
      Swal.fire('Error', 'Failed to load watch details', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchWatch();
  }, [fetchWatch]);

  const imageList = useMemo(() => {
    if (!watch) return [];
    const images = Array.isArray(watch.images) ? watch.images : [];
    if (images.length > 0) return images;
    const primary = getPrimaryWatchImage(watch);
    return primary ? [primary] : [];
  }, [watch]);

  const mediaItems = useMemo(() => {
    if (!watch) return [];
    const items = [...imageList.map((img) => ({ type: 'image', src: resolveMediaUrl(img) }))];
    if (watch.video) items.push({ type: 'video', src: resolveMediaUrl(watch.video) });
    return items;
  }, [watch, imageList]);

  const handleBack = () => {
    const from = location.state?.from;
    if (typeof from === 'string' && from.length > 0) {
      navigate(from);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/watches');
  };

  const handleAddToCart = () => {
    if (authLoading || !watch) return;
    if (!user) {
      Swal.fire('Login required', 'Please login to add products to cart', 'info').then(() => {
        navigate('/login');
      });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find((item) => item._id === watch._id);

    if (existingItem) existingItem.quantity += quantity;
    else cart.push({ ...watch, quantity });

    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartCount', cart.reduce((sum, item) => sum + item.quantity, 0));
    window.dispatchEvent(new Event('cartUpdated'));

    Swal.fire({
      title: 'Added to cart',
      text: 'Your watch is in the cart.',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Go to Cart',
      cancelButtonText: 'Continue Shopping',
    }).then((result) => {
      if (result.isConfirmed) navigate('/cart');
    });
  };

  const handleBuyNow = () => {
    if (authLoading || !watch) return;
    if (!user) {
      Swal.fire('Login required', 'Please login to continue', 'info').then(() => {
        navigate('/login');
      });
      return;
    }

    const payload = { watch, quantity };
    sessionStorage.setItem('buyNow', JSON.stringify(payload));
    navigate('/checkout', { state: { buyNow: payload } });
  };

  const emiOptions = useMemo(() => {
    const price = Number(watch?.price || 0);
    return [3, 6, 12].map((months) => ({
      months,
      monthly: months > 0 ? price / months : price,
    }));
  }, [watch?.price]);

  if (loading) {
    return (
      <div className="lux-page">
        <Container className="text-center" style={{ paddingTop: 140, paddingBottom: 80 }}>
          <Spinner animation="border" />
        </Container>
      </div>
    );
  }

  if (!watch) {
    return (
      <div className="lux-page">
        <Container className="text-center" style={{ paddingTop: 140, paddingBottom: 80 }}>
          <h3 style={{ color: 'var(--text-primary)' }}>Watch not found</h3>
        </Container>
      </div>
    );
  }

  return (
    <div className="lux-page">
      <Container className="watchdetail-shell">
        <div className="watchdetail-back">
          <Button variant="outline-primary" size="sm" onClick={handleBack}>
            ← Back
          </Button>
        </div>

        <Row className="g-4">
          <Col md={6}>
            <div className="watchdetail-media">
              {mediaItems.length > 1 ? (
                <Carousel className="watchdetail-carousel" interval={3500} pause="hover" variant="dark">
                  {mediaItems.map((item, idx) => (
                    <Carousel.Item key={`${item.type}-${item.src}-${idx}`}>
                      {item.type === 'image' ? (
                        <img
                          src={item.src}
                          alt={watch.title}
                          className="watchdetail-mediaEl"
                        />
                      ) : (
                        <video
                          className="watchdetail-mediaEl"
                          src={item.src}
                          poster={imageList[0] ? resolveMediaUrl(imageList[0]) : undefined}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                        />
                      )}
                    </Carousel.Item>
                  ))}
                </Carousel>
              ) : mediaItems.length === 1 && mediaItems[0]?.type === 'video' ? (
                <video
                  className="watchdetail-mediaEl"
                  src={mediaItems[0].src}
                  poster={imageList[0] ? resolveMediaUrl(imageList[0]) : undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={resolveMediaUrl(getPrimaryWatchImage(watch))}
                  alt={watch.title}
                  className="watchdetail-mediaEl"
                />
              )}
            </div>
          </Col>

          <Col md={6}>
            <div className="lux-overline" style={{ letterSpacing: '0.32em' }}>
              {watch.brand || 'Caliber'}
            </div>
            <h1 className="watchdetail-title">{watch.title}</h1>
            <div className="watchdetail-price">{formatCurrencyINR(watch.price)}</div>
            <p className="watchdetail-desc">{watch.description}</p>

            <Card className="watchdetail-panel p-4">
              <Form onSubmit={(e) => e.preventDefault()}>
                <Form.Group className="mb-3">
                  <div className="form-label">Quantity</div>
                  <Form.Control
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button type="button" size="lg" variant="primary" onClick={handleAddToCart}>
                    Add to Cart
                  </Button>
                  <Button type="button" size="lg" variant="outline-primary" onClick={handleBuyNow}>
                    Buy Now
                  </Button>
                </div>
              </Form>
            </Card>

            <div className="mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Secure checkout • Insured shipping • Support included
            </div>
          </Col>
        </Row>

        <Row className="g-4 mt-1">
          <Col lg={8}>
            <Accordion className="watchdetail-accordion" defaultActiveKey="shipping" alwaysOpen>
              <Accordion.Item eventKey="emi">
                <Accordion.Header>EMI & Payment Options</Accordion.Header>
                <Accordion.Body>
                  <div className="watchdetail-kv">
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Payment</div>
                      <div className="watchdetail-value">Cards • UPI • Netbanking • Wallet • COD</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">EMI (Demo)</div>
                      <div className="watchdetail-value">0% interest for eligible cards</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="watchdetail-label" style={{ marginBottom: 8 }}>
                      Example installments (per item)
                    </div>
                    <div className="watchdetail-kv">
                      {emiOptions.map((o) => (
                        <div className="watchdetail-row" key={o.months}>
                          <div className="watchdetail-label">{o.months} months</div>
                          <div className="watchdetail-value">{formatCurrencyINR(o.monthly)} / month</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                      EMI values are estimates. Final eligibility may vary by bank/provider.
                    </div>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="shipping">
                <Accordion.Header>Shipping Details</Accordion.Header>
                <Accordion.Body>
                  <div className="watchdetail-kv">
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Dispatch</div>
                      <div className="watchdetail-value">Within 24–48 hours</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Delivery</div>
                      <div className="watchdetail-value">3–7 business days</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Packaging</div>
                      <div className="watchdetail-value">Secure box + protective wrap</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Tracking</div>
                      <div className="watchdetail-value">Provided after dispatch</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link to="/shipping" className="btn btn-outline-primary btn-sm">
                      Shipping & Returns
                    </Link>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="returns">
                <Accordion.Header>Returns, Warranty & Support</Accordion.Header>
                <Accordion.Body>
                  <div className="watchdetail-kv">
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Return Window</div>
                      <div className="watchdetail-value">7 days (unused, original packaging)</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Warranty</div>
                      <div className="watchdetail-value">Manufacturer warranty (where applicable)</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Support</div>
                      <div className="watchdetail-value">Email support + order tracking help</div>
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    <Link to="/faq" className="btn btn-outline-primary btn-sm">
                      FAQ
                    </Link>
                    <Link to="/contact" className="btn btn-outline-primary btn-sm">
                      Contact
                    </Link>
                  </div>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="authenticity">
                <Accordion.Header>Authenticity & What’s Included</Accordion.Header>
                <Accordion.Body>
                  <div className="watchdetail-kv">
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Authenticity</div>
                      <div className="watchdetail-value">Trusted listings + clear product details</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">In the Box</div>
                      <div className="watchdetail-value">Watch + packaging (items may vary by brand)</div>
                    </div>
                    <div className="watchdetail-row">
                      <div className="watchdetail-label">Care Tips</div>
                      <div className="watchdetail-value">Avoid moisture • Clean with soft cloth</div>
                    </div>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Col>

          <Col lg={4}>
            <Card className="watchdetail-panel p-4">
              <div className="lux-overline" style={{ letterSpacing: '0.32em' }}>
                Quick Info
              </div>
              <div className="watchdetail-kv">
                <div className="watchdetail-row">
                  <div className="watchdetail-label">Category</div>
                  <div className="watchdetail-value">{watch.category || '—'}</div>
                </div>
                <div className="watchdetail-row">
                  <div className="watchdetail-label">Rating</div>
                  <div className="watchdetail-value">{watch.rating ? `${watch.rating} / 5` : '—'}</div>
                </div>
                <div className="watchdetail-row">
                  <div className="watchdetail-label">Stock</div>
                  <div className="watchdetail-value">{typeof watch.stock === 'number' ? watch.stock : '—'}</div>
                </div>
              </div>

              <div className="mt-3 d-grid gap-2">
                <Button type="button" variant="primary" onClick={handleBuyNow}>
                  Buy Now
                </Button>
                <Button type="button" variant="outline-primary" onClick={handleAddToCart}>
                  Add to Cart
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default WatchDetail;
