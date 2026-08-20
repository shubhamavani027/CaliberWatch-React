import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Form, Button, Spinner } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { orderAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatCurrencyINR } from '../utils/currency';
import { getPrimaryWatchImage, resolveMediaUrl } from '../utils/media';

import './Home.css';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirmed
  const [loading, setLoading] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [isBuyNow, setIsBuyNow] = useState(false);

  const [cart, setCart] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  const [paymentMethod, setPaymentMethod] = useState('card'); // card | upi | netbanking | wallet | cod
  const [paymentDetails, setPaymentDetails] = useState({
    cardHolder: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: '',
    upiTxnId: '',
    bankName: '',
    bankRef: '',
    walletName: '',
    walletRef: '',
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  });

  const SHIPPING_COST = 10;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Swal.fire('Error', 'Please login first', 'error').then(() => {
        navigate('/login');
      });
      return;
    }

    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    if (cartData.length > 0) {
      setIsBuyNow(false);
      setCart(cartData);
      const total = cartData.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setSubtotal(total);
      return;
    }

    const fromState = location.state?.buyNow;
    let buyNow = fromState;

    if (!buyNow) {
      try {
        const stored = sessionStorage.getItem('buyNow');
        buyNow = stored ? JSON.parse(stored) : null;
      } catch {
        buyNow = null;
      }
    }

    const watch = buyNow?.watch;
    const quantity = Number(buyNow?.quantity || 1);

    if (watch && watch._id && quantity > 0) {
      setIsBuyNow(true);
      setCart([{ ...watch, quantity }]);
      setSubtotal(Number(watch.price || 0) * quantity);
      return;
    }

    navigate('/cart');
  }, [user, authLoading, navigate, location.state]);

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user?.name || '',
      phone: prev.phone || user?.phone || '',
      addressLine1: prev.addressLine1 || user?.address?.addressLine1 || '',
      addressLine2: prev.addressLine2 || user?.address?.addressLine2 || '',
      city: prev.city || user?.address?.city || '',
      state: prev.state || user?.address?.state || '',
      zip: prev.zip || user?.address?.zip || '',
      country: prev.country || user?.address?.country || '',
    }));
  }, [user]);

  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart]
  );

  const shipping = SHIPPING_COST;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const getFakeTransactionId = () => {
    const now = Date.now();
    if (paymentMethod === 'upi') return paymentDetails.upiTxnId?.trim() || `UPI-${now}`;
    if (paymentMethod === 'netbanking') return paymentDetails.bankRef?.trim() || `NB-${now}`;
    if (paymentMethod === 'wallet') return paymentDetails.walletRef?.trim() || `WALLET-${now}`;
    if (paymentMethod === 'cod') return 'COD';

    const digitsOnly = String(paymentDetails.cardNumber || '').replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4) || '0000';
    return `CARD-${last4}-${now}`;
  };

  const canContinueShipping = useMemo(() => {
    return (
      formData.fullName.trim() &&
      formData.phone.trim() &&
      formData.addressLine1.trim() &&
      formData.city.trim() &&
      formData.state.trim() &&
      formData.zip.trim() &&
      formData.country.trim()
    );
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let receiptEmailSent = false;
      let receiptToEmail = user?.email || '';
      let receiptNumber = '';

      const orderData = {
        fullName: formData.fullName,
        phone: formData.phone,
        shippingAddress: {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        items: cart.map((item) => ({
          watch: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        shipping,
        total,
        payment: {
          provider: paymentMethod === 'cod' ? 'cod' : 'fake',
          method: paymentMethod,
          transactionId: getFakeTransactionId(),
        },
      };

      const createRes = await orderAPI.createOrder(orderData);
      const createdOrder = createRes.data?.order;
      receiptToEmail = createdOrder?.userEmail || receiptToEmail;

      if (createdOrder?._id) {
        if (paymentMethod !== 'cod') {
          try {
            const payRes = await orderAPI.markPaymentSuccess(createdOrder._id, {
              provider: 'fake',
              method: paymentMethod,
              transactionId: getFakeTransactionId(),
            });
            const emailOk = payRes?.data?.email?.ok;
            receiptEmailSent = emailOk === true;
            receiptToEmail = payRes?.data?.order?.userEmail || receiptToEmail;
            receiptNumber = payRes?.data?.order?.receiptNumber || receiptNumber;

            if (emailOk === false) {
              const reason = payRes?.data?.email?.error || 'Email is not configured on the server';
              const note =
                reason.includes('SMTP authentication failed') || reason.includes('Gmail')
                  ? 'Order placed, but receipt email was not sent (server email settings need to be fixed).'
                  : 'Order placed, but receipt email was not sent.';
              // eslint-disable-next-line no-console
              console.warn('Receipt email failed:', reason);
              await Swal.fire('Note', note, 'info');
            }
          } catch {}
        }
      }

      const receiptLine =
        receiptEmailSent && receiptToEmail
          ? `Receipt sent to ${receiptToEmail}${receiptNumber ? ` (Receipt: ${receiptNumber})` : ''}.`
          : receiptEmailSent
            ? `Receipt sent to your email${receiptNumber ? ` (Receipt: ${receiptNumber})` : ''}.`
            : '';

      const codLine =
        paymentMethod === 'cod'
          ? 'Cash on Delivery selected. Receipt will be emailed and available to download after delivery.'
          : '';

      const text =
        receiptLine || codLine
          ? `Order placed successfully. ${[receiptLine, codLine].filter(Boolean).join(' ')}`
          : 'Order placed successfully';

      setSuccessText(text);
      setStep(3);

      if (isBuyNow) {
        sessionStorage.removeItem('buyNow');
      } else {
        localStorage.removeItem('cart');
        localStorage.setItem('cartCount', 0);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 10000);
    } catch (error) {
      const message = error.response?.data?.message || 'Order failed';
      Swal.fire('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="lux-page">
        <Container className="text-center" style={{ paddingTop: 140, paddingBottom: 80 }}>
          <Spinner animation="border" />
        </Container>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="lux-page">
        <Container className="text-center" style={{ paddingTop: 140, paddingBottom: 80 }}>
          <Spinner animation="border" />
        </Container>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="lux-page checkout-success">
        <div className="checkout-successCard">
          <div className="checkout-successIcon" aria-hidden="true">
            ✓
          </div>
          <div className="lux-overline">Order Confirmed</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: 12 }}>
            Thank you for choosing <span className="lux-text-gold-gradient">Caliber</span>.
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 18 }}>{successText}</p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <Button variant="outline-primary" onClick={() => navigate('/', { replace: true })}>
              Return Home
            </Button>
            <Link to="/watches" className="btn btn-primary">
              Explore Watches
            </Link>
          </div>
          <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Redirecting to dashboard in ~10 seconds…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lux-page">
      <Container className="checkout-shell">
        <div className="checkout-head">
          <div>
            <div className="lux-overline">Secure Checkout</div>
            <h1 className="checkout-title">
              Checkout <span className="lux-text-gold-gradient">Details</span>
            </h1>
            <div className="checkout-sub">
              {totalQuantity} item{totalQuantity === 1 ? '' : 's'} • Shipping + payment confirmation
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/cart" className="btn btn-outline-primary">
              Back to Cart
            </Link>
            <Link to="/watches" className="btn btn-outline-primary">
              Continue Shopping
            </Link>
          </div>
        </div>

        <div className="checkout-steps">
          <div className={`checkout-step ${step === 1 ? 'checkout-step--active' : ''}`}>
            <div className="checkout-step__icon" aria-hidden="true">
              🚚
            </div>
            <div className="checkout-step__label">Shipping</div>
          </div>
          <div className="checkout-rail" aria-hidden="true" />
          <div className={`checkout-step ${step === 2 ? 'checkout-step--active' : ''}`}>
            <div className="checkout-step__icon" aria-hidden="true">
              💳
            </div>
            <div className="checkout-step__label">Payment</div>
          </div>
          <div className="checkout-rail" aria-hidden="true" />
          <div className="checkout-step">
            <div className="checkout-step__icon" aria-hidden="true">
              ✓
            </div>
            <div className="checkout-step__label">Confirmed</div>
          </div>
        </div>

        <div className="checkout-layout">
          <div>
            <Form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="checkout-panel">
                  <div className="checkout-panel__head">
                    <div className="checkout-panel__icon" aria-hidden="true">
                      🚚
                    </div>
                    <h2 className="checkout-panel__title">Shipping Details</h2>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="form-label">Full Name</div>
                      <Form.Control type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">Phone</div>
                      <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                    <div className="col-12">
                      <div className="form-label">Address Line 1</div>
                      <Form.Control type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required />
                    </div>
                    <div className="col-12">
                      <div className="form-label">Address Line 2</div>
                      <Form.Control type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">City</div>
                      <Form.Control type="text" name="city" value={formData.city} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">State</div>
                      <Form.Control type="text" name="state" value={formData.state} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">ZIP Code</div>
                      <Form.Control type="text" name="zip" value={formData.zip} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                      <div className="form-label">Country</div>
                      <Form.Control type="text" name="country" value={formData.country} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-between mt-4">
                    <Link to="/cart" className="btn btn-outline-primary">
                      Back
                    </Link>
                    <Button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setStep(2)}
                      disabled={!canContinueShipping}
                    >
                      Continue →
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="checkout-panel">
                  <div className="checkout-panel__head">
                    <div className="checkout-panel__icon" aria-hidden="true">
                      💳
                    </div>
                    <h2 className="checkout-panel__title">Payment Method</h2>
                  </div>

                  <div className="mb-3">
                    <div className="form-label">Method</div>
                    <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="wallet">Wallet</option>
                      <option value="cod">Cash on Delivery</option>
                    </Form.Select>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
                      Demo payment: any details you enter will be treated as successful.
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-label">Card Holder Name</div>
                        <Form.Control type="text" name="cardHolder" value={paymentDetails.cardHolder} onChange={handlePaymentChange} required />
                      </div>
                      <div className="col-md-6">
                        <div className="form-label">Card Number</div>
                        <Form.Control
                          type="text"
                          name="cardNumber"
                          value={paymentDetails.cardNumber}
                          onChange={handlePaymentChange}
                          placeholder="1234 5678 9012 3456"
                          inputMode="numeric"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="form-label">Expiry</div>
                        <Form.Control type="text" name="cardExpiry" value={paymentDetails.cardExpiry} onChange={handlePaymentChange} placeholder="MM/YY" required />
                      </div>
                      <div className="col-md-6">
                        <div className="form-label">CVV</div>
                        <Form.Control type="password" name="cardCvv" value={paymentDetails.cardCvv} onChange={handlePaymentChange} placeholder="***" inputMode="numeric" required />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'upi' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-label">UPI ID</div>
                        <Form.Control type="text" name="upiId" value={paymentDetails.upiId} onChange={handlePaymentChange} placeholder="name@bank" required />
                      </div>
                      <div className="col-md-6">
                        <div className="form-label">Transaction ID (optional)</div>
                        <Form.Control type="text" name="upiTxnId" value={paymentDetails.upiTxnId} onChange={handlePaymentChange} placeholder="UPI transaction reference" />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'netbanking' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-label">Bank Name</div>
                        <Form.Control type="text" name="bankName" value={paymentDetails.bankName} onChange={handlePaymentChange} placeholder="Your bank" required />
                      </div>
                      <div className="col-md-6">
                        <div className="form-label">Reference ID (optional)</div>
                        <Form.Control type="text" name="bankRef" value={paymentDetails.bankRef} onChange={handlePaymentChange} placeholder="Bank reference" />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'wallet' && (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-label">Wallet</div>
                        <Form.Control type="text" name="walletName" value={paymentDetails.walletName} onChange={handlePaymentChange} placeholder="Paytm / PhonePe / etc." required />
                      </div>
                      <div className="col-md-6">
                        <div className="form-label">Reference ID (optional)</div>
                        <Form.Control type="text" name="walletRef" value={paymentDetails.walletRef} onChange={handlePaymentChange} placeholder="Wallet reference" />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div style={{ color: 'var(--text-muted)' }}>
                      You will pay in cash at the time of delivery (demo: we still mark payment as successful).
                    </div>
                  )}

                  <div className="d-flex flex-wrap gap-2 justify-content-between mt-4">
                    <Button type="button" variant="outline-primary" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Processing…' : 'Place Order'} →
                    </Button>
                  </div>

                  <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                    Encrypted transaction • Insured shipping • Support included
                  </div>
                </div>
              )}
            </Form>
          </div>

          <aside className="checkout-summary">
            <div className="checkout-panel">
              <div className="checkout-panel__head">
                <div className="checkout-panel__icon" aria-hidden="true">
                  🧾
                </div>
                <h3 className="checkout-panel__title">Your Order</h3>
              </div>

              <div className="checkout-items">
                {cart.map((item) => (
                  <div className="checkout-item" key={item._id}>
                    <div className="checkout-item__media">
                      <img
                        src={resolveMediaUrl(getPrimaryWatchImage(item) || item.image || '')}
                        alt={item.title || item.name || 'Watch'}
                        loading="lazy"
                      />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="checkout-item__title">{item.title || item.name || 'Watch'}</div>
                      <div className="checkout-item__meta">
                        {formatCurrencyINR(item.price)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="checkout-summaryDivider" />

              <div className="checkout-summaryRow">
                <span>Subtotal</span>
                <span className="mono">{formatCurrencyINR(subtotal)}</span>
              </div>
              <div className="checkout-summaryRow">
                <span>Shipping</span>
                <span className="mono">{formatCurrencyINR(shipping)}</span>
              </div>

              <div className="checkout-summaryDivider" />

              <div className="checkout-summaryRow" style={{ fontSize: '1.05rem' }}>
                <strong>Total</strong>
                <strong className="mono" style={{ color: 'var(--luxury-gold)' }}>
                  {formatCurrencyINR(total)}
                </strong>
              </div>

              {step === 1 ? (
                <Button
                  type="button"
                  className="btn btn-primary w-100 mt-3"
                  onClick={() => setStep(2)}
                  disabled={!canContinueShipping}
                >
                  Continue to Payment
                </Button>
              ) : (
                <Button type="button" className="btn btn-primary w-100 mt-3" onClick={() => {}} disabled>
                  Ready to Place Order
                </Button>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

export default Checkout;
