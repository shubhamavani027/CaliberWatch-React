import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrencyINR } from '../utils/currency';
import { getPrimaryWatchImage, resolveMediaUrl } from '../utils/media';
import './Home.css';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  const calculateSubtotal = useCallback((cartData) => {
    const total = cartData.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setSubtotal(total);
  }, []);

  const loadCart = useCallback(() => {
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(cartData);
    calculateSubtotal(cartData);
  }, [calculateSubtotal]);

  useEffect(() => {
    loadCart();
    window.addEventListener('cartUpdated', loadCart);
    return () => window.removeEventListener('cartUpdated', loadCart);
  }, [loadCart]);

  const updateQuantity = (id, newQuantity) => {
    const updatedCart = cart.map((item) =>
      item._id === id ? { ...item, quantity: newQuantity } : item
    );
    const filteredCart = updatedCart.filter((item) => item.quantity > 0);
    setCart(filteredCart);
    localStorage.setItem('cart', JSON.stringify(filteredCart));
    localStorage.setItem('cartCount', filteredCart.reduce((sum, item) => sum + item.quantity, 0));
    calculateSubtotal(filteredCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id) => {
    const updatedCart = cart.filter((item) => item._id !== id);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    localStorage.setItem('cartCount', updatedCart.reduce((sum, item) => sum + item.quantity, 0));
    calculateSubtotal(updatedCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const shipping = 10;
  const total = subtotal + shipping;

  const totalQuantity = useMemo(() => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0), [cart]);

  if (cart.length === 0) {
    return (
      <div className="lux-page cart-page cart-page--video">
        <video className="cart-page__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/images/cartPage.mp4" type="video/mp4" />
        </video>
        <div className="cart-page__overlay" aria-hidden="true" />
        <Container className="cart-shell">
          <div className="cart-empty">
            <div className="lux-overline">Your Selection</div>
            <h1 className="cart-title">
              Your Cart is <span className="lux-text-gold-gradient">Empty</span>
            </h1>
            <p className="cart-sub">
              Explore our curated collection and find the timepiece that fits your legacy.
            </p>
            <div className="d-flex gap-2 justify-content-center flex-wrap mt-3">
              <Link to="/watches" className="btn btn-primary">
                Explore Collection
              </Link>
              <Link to="/brands" className="btn btn-outline-primary">
                View Brands
              </Link>
            </div>

            <div className="cart-emptyBox">
              <div style={{ color: 'var(--text-primary)', fontWeight: 800, marginBottom: 10 }}>
                Why shop with Caliber
              </div>
              <ul style={{ color: 'var(--text-muted)', margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
                <li>Trusted listings with clear details</li>
                <li>Secure checkout and order tracking</li>
                <li>Support that stays with you after checkout</li>
              </ul>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="lux-page cart-page cart-page--video">
      <video className="cart-page__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/images/cartPage.mp4" type="video/mp4" />
      </video>
      <div className="cart-page__overlay" aria-hidden="true" />
      <Container className="cart-shell">
        <div className="cart-head">
          <div>
            <div className="lux-overline">Secure Checkout</div>
            <h1 className="cart-title">
              Shopping <span className="lux-text-gold-gradient">Cart</span>
            </h1>
            <div className="cart-sub">
              {totalQuantity} item{totalQuantity === 1 ? '' : 's'} • Ready for checkout
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <Link to="/watches" className="btn btn-outline-primary">
              Continue Shopping
            </Link>
            <Button className="btn btn-primary" onClick={() => navigate('/checkout')}>
              Checkout →
            </Button>
          </div>
        </div>

        <div className="cart-layout">
          <div className="cart-grid">
            {cart.map((item, idx) => (
              <div key={item._id} className="cart-item" style={{ animationDelay: `${Math.min(idx * 40, 240)}ms` }}>
                <div className="cart-item__media">
                  <img
                    src={resolveMediaUrl(getPrimaryWatchImage(item) || item.image || '')}
                    alt={item.title || item.name || 'Watch'}
                    loading="lazy"
                  />
                </div>

                <div className="cart-item__main">
                  <div className="lux-overline" style={{ letterSpacing: '0.22em', marginBottom: 8 }}>
                    {item.brand || item.category || 'Caliber'}
                  </div>
                  <div className="cart-item__name">{item.title || item.name || 'Watch'}</div>
                  <div className="cart-item__meta">Unit price</div>
                  <div className="cart-item__unit">{formatCurrencyINR(item.price)}</div>
                </div>

                <div className="cart-item__right">
                  <div className="cart-stepper" aria-label="Quantity">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, Number(item.quantity || 0) - 1)}
                      aria-label="Decrease quantity"
                      title="Decrease"
                    >
                      −
                    </button>
                    <div className="cart-stepper__qty">{item.quantity}</div>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, Number(item.quantity || 0) + 1)}
                      aria-label="Increase quantity"
                      title="Increase"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-itemTotal">
                    <div className="cart-itemTotal__label">Total</div>
                    <div className="cart-itemTotal__value">{formatCurrencyINR(item.price * item.quantity)}</div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeItem(item._id)}
                      style={{ marginTop: 10 }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary__title">Order Summary</div>

            <div className="cart-summaryRow">
              <span>Subtotal</span>
              <span className="mono">{formatCurrencyINR(subtotal)}</span>
            </div>
            <div className="cart-summaryRow">
              <span>Shipping</span>
              <span className="mono">{formatCurrencyINR(shipping)}</span>
            </div>

            <div className="cart-summaryDivider" />

            <div className="cart-summaryRow" style={{ fontSize: '1.05rem' }}>
              <strong>Total</strong>
              <strong className="mono" style={{ color: 'var(--luxury-gold)' }}>
                {formatCurrencyINR(total)}
              </strong>
            </div>

            <div className="mt-3 d-grid gap-2">
              <Link to="/checkout" className="btn btn-primary">
                Secure Checkout
              </Link>
              <Button variant="outline-primary" onClick={loadCart}>
                Refresh Cart
              </Button>
            </div>

            <div className="mt-3" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              Encrypted checkout • Order updates • Support included
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default Cart;
