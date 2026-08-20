import React, { useContext, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Swal from 'sweetalert2';
import WatchCardMedia from '../components/WatchCardMedia';
import { formatCurrencyINR } from '../utils/currency';
import './Home.css';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wishlist')) || [];
    setWishlist(saved);
  }, []);

  const removeItem = (id) => {
    const updated = wishlist.filter((item) => item._id !== id);
    setWishlist(updated);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    Swal.fire('Removed', 'Item removed from wishlist', 'success');
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
    const existing = cart.find((i) => i._id === watch._id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...watch, quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    // remove from wishlist after adding
    removeItem(watch._id);
    Swal.fire('Added', 'Item moved to cart', 'success');
    navigate('/cart');
  };

  return (
    <div className="lux-page">
      <section className="lux-section" style={{ paddingTop: 128 }}>
        <Container>
          <div className="lux-sectionHeader" style={{ marginBottom: 28 }}>
            <div className="lux-overline">Saved</div>
            <h1 className="lux-sectionTitle" style={{ fontSize: '2.9rem' }}>
              My <span className="lux-text-gold-gradient">Wishlist</span>
            </h1>
            <p className="lux-sectionSub">Keep track of favorites and move them to your cart anytime.</p>
          </div>

          {wishlist.length === 0 ? (
            <div className="text-center py-5">
              <h4 style={{ color: 'var(--text-primary)' }}>Your wishlist is empty</h4>
              <p>Browse the collection and add your favorites.</p>
              <Link to="/watches" className="btn btn-primary">
                Browse Watches
              </Link>
            </div>
          ) : (
            <Row className="g-4">
              {wishlist.map((watch) => (
                <Col md={6} lg={4} key={watch._id}>
                  <Card className="lux-productCard">
                    <div className="lux-productCard__imageWrap">
                      <div className="lux-productCard__pill">{watch.brand || 'Caliber'}</div>
                      <WatchCardMedia watch={watch} className="lux-productCard__img" alt={watch.title} />
                      <div className="lux-productCard__overlay">
                        <Link to={`/watch/${watch._id}`} state={{ from: `${location.pathname}${location.search}` }} className="btn btn-outline-primary">
                          View Details
                        </Link>
                      </div>
                    </div>
                    <Card.Body>
                      <div className="lux-overline" style={{ letterSpacing: '0.32em', marginBottom: 10 }}>
                        {watch.category || 'Collection'}
                      </div>
                      <div className="lux-productCard__title">{watch.title}</div>
                      <div className="lux-productCard__price">{formatCurrencyINR(watch.price)}</div>
                      <div className="d-flex gap-2 mt-3">
                        <Button className="w-100" onClick={() => addToCart(watch)}>
                          Add to Cart
                        </Button>
                        <Button className="w-100" variant="outline-primary" onClick={() => removeItem(watch._id)}>
                          Remove
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>
    </div>
  );
}

export default Wishlist;
