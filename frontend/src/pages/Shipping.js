import React, { useContext, useMemo, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import './Home.css';
import './Shipping.css';

const DELIVERY_OPTIONS = [
  {
    name: 'Tomorrow',
    badge: 'Fastest',
    date: 'Tomorrow by 10 PM',
    description: 'Priority dispatch for metro pincodes with secure packaging and same-day route assignment.',
    window: 'Order before 4 PM',
    price: 'Free',
  },
  {
    name: '2-Day',
    badge: 'Popular',
    date: 'In 2 business days',
    description: 'Balanced speed and coverage for most tier-1 and tier-2 cities across India.',
    window: 'Live tracking included',
    price: 'Free',
  },
  {
    name: 'Standard',
    badge: 'Wider reach',
    date: '3 to 5 business days',
    description: 'Best option for extended service areas with careful handoff and return support.',
    window: 'Extended route network',
    price: 'Free',
  },
];

const PROMISES = [
  { title: 'Packed securely', time: '0-6 hrs', description: 'Invoice, premium box, and protective wrap are prepared before dispatch.' },
  { title: 'Shipped from hub', time: 'Same day', description: 'Tracking activates once the parcel is scanned by the courier partner.' },
  { title: 'Out for delivery', time: 'Delivery day', description: 'High-value deliveries follow a monitored handoff process.' },
];

const BENEFITS = [
  { title: 'Insured shipping', description: 'Every qualifying order is protected in transit with premium handling.' },
  { title: 'Partner fallback', description: 'Routes can switch to another verified courier when service demand spikes.' },
  { title: 'Return pickup support', description: 'Eligible returns can be scheduled from your original delivery address.' },
];

const STEPS = [
  { index: '01', title: 'Address check', description: 'Enter your pincode to preview serviceability and delivery speed.' },
  { index: '02', title: 'Dispatch priority', description: 'Orders are grouped by payment verification, route, and promise level.' },
  { index: '03', title: 'Live tracking', description: 'Shipment updates move from packed to shipped to out for delivery.' },
  { index: '04', title: 'Secure delivery', description: 'Premium orders can include contact confirmation at handoff.' },
];

const STEP_DETAILS = [
  { label: 'Service window', value: 'Mon-Sat, 9 AM to 8 PM' },
  { label: 'Coverage', value: 'Metro, tier-1, tier-2, and extended route support' },
  { label: 'Protection', value: 'Insured packaging with verified courier handoff' },
];

const POLICIES = [
  { title: '7-day return window', description: 'Unused products in original condition can be requested for return within seven days.' },
  { title: 'Damaged-on-arrival support', description: 'If packaging arrives damaged, report it immediately for priority assistance.' },
  { title: 'Delivery help desk', description: 'Shipping questions, route changes, and missed-delivery support are available anytime.' },
];

const TRACKING_CHECKPOINTS = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

function Shipping() {
  const { user, loading } = useContext(AuthContext);
  const [pincode, setPincode] = useState('');
  const [lastCheckedPincode, setLastCheckedPincode] = useState('');
  const [selectedSpeed, setSelectedSpeed] = useState('Tomorrow');
  const [trackingIndex, setTrackingIndex] = useState(2);
  const isLoggedIn = !!user;

  const normalizedPincode = useMemo(() => lastCheckedPincode.replace(/\D/g, '').slice(0, 6), [lastCheckedPincode]);
  const availabilityTone = useMemo(() => {
    if (!normalizedPincode) return 'neutral';
    return normalizedPincode.startsWith('1') || normalizedPincode.startsWith('4') || normalizedPincode.startsWith('5')
      ? 'success'
      : 'warn';
  }, [normalizedPincode]);

  const selectedOption = useMemo(
    () => DELIVERY_OPTIONS.find((item) => item.name === selectedSpeed) || DELIVERY_OPTIONS[0],
    [selectedSpeed]
  );

  const availabilityTitle = !normalizedPincode
    ? 'Check delivery to your area'
    : availabilityTone === 'success'
      ? `Delivery available for ${normalizedPincode}`
      : `Limited-speed delivery for ${normalizedPincode}`;

  const availabilityMessage = !normalizedPincode
    ? 'Use any 6-digit pincode to preview estimated arrival, service level, and shipping support before checkout.'
    : availabilityTone === 'success'
      ? `${selectedSpeed} delivery is available for this area with insured shipment handling and premium tracking support.`
      : 'This area is serviceable, but the fastest slot may shift to a safer route with standard logistics support.';

  const estimatedArrival =
    !normalizedPincode
      ? 'Enter pincode'
      : selectedSpeed === 'Tomorrow' && availabilityTone === 'warn'
        ? '2 to 3 business days'
        : selectedOption.date;

  return (
    <div className="lux-page shipping-page">
      <section className="shipping-hero">
        <div className="shipping-hero__glow" aria-hidden="true" />
        <Container className="shipping-hero__container">
          <div className="shipping-panel shipping-panel--hero">
            <Row className="g-4">
              <Col lg={8}>
                <div className="lux-overline">Shipping Center</div>
                <h1 className="shipping-title">Fast delivery planning with premium shipping clarity.</h1>
                <p className="shipping-copy">
                  Check serviceability, compare delivery speeds, and understand returns before you place the order.
                </p>

                <div className="shipping-checker">
                  <div className="shipping-field">
                    <label htmlFor="shipping-pincode">Delivery Pincode</label>
                    <input
                      id="shipping-pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="Enter 6-digit pincode"
                    />
                  </div>
                  <div className="shipping-field">
                    <label htmlFor="shipping-speed">Selected Delivery</label>
                    <select id="shipping-speed" value={selectedSpeed} onChange={(e) => setSelectedSpeed(e.target.value)}>
                      {DELIVERY_OPTIONS.map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" className="btn btn-primary" onClick={() => setLastCheckedPincode(pincode)}>
                    Check
                  </button>
                </div>

                <div className={`shipping-status shipping-status--${availabilityTone}`}>
                  <div>
                    <div className="shipping-status__eyebrow">Delivery Status</div>
                    <h2 className="shipping-status__title">{availabilityTitle}</h2>
                    <p className="shipping-status__text">{availabilityMessage}</p>
                  </div>
                  <div className="shipping-status__arrival">
                    <span>Expected arrival</span>
                    <strong>{estimatedArrival}</strong>
                  </div>
                </div>

                <div className="shipping-options">
                  {DELIVERY_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      className={`shipping-option ${selectedSpeed === option.name ? 'shipping-option--active' : ''}`}
                      onClick={() => setSelectedSpeed(option.name)}
                    >
                      <div className="shipping-option__top">
                        <div className="shipping-option__name">{option.name}</div>
                        <div className="shipping-option__badge">{option.badge}</div>
                      </div>
                      <div className="shipping-option__date">{option.date}</div>
                      <div className="shipping-option__desc">{option.description}</div>
                      <div className="shipping-option__bottom">
                        <span>{option.window}</span>
                        <strong>{option.price}</strong>
                      </div>
                    </button>
                  ))}
                </div>

                {!loading && !isLoggedIn ? (
                  <div className="shipping-accessNote">
                    <div>
                      <div className="shipping-accessNote__eyebrow">Member Access</div>
                      <h2 className="shipping-accessNote__title">Login to unlock full shipping details</h2>
                      <p className="shipping-accessNote__text">
                        Basic delivery estimates are visible here. Sign in to access live tracking previews, courier
                        timeline details, and full delivery support information before checkout.
                      </p>
                    </div>
                    <div className="shipping-accessNote__actions">
                      <Link to="/login" className="btn btn-primary">
                        Login
                      </Link>
                      <Link to="/register" className="btn btn-outline-primary">
                        Create Account
                      </Link>
                    </div>
                  </div>
                ) : null}
              </Col>

              <Col lg={4}>
                <div className="shipping-sideStack">
                  <div className="shipping-sideCard shipping-sideCard--gold">
                    <div className="shipping-sideCard__eyebrow">Order Promise</div>
                    <h2 className="shipping-sideCard__title">Shipping dashboard preview</h2>
                    <div className="shipping-list">
                      {PROMISES.map((item) => (
                        <div key={item.title} className="shipping-miniCard">
                          <div className="shipping-miniCard__top">
                            <span>{item.title}</span>
                            <small>{item.time}</small>
                          </div>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shipping-sideCard">
                    <div className="shipping-sideCard__eyebrow">Shipping Benefits</div>
                    <div className="shipping-list">
                      {BENEFITS.map((item) => (
                        <div key={item.title} className="shipping-benefitCard">
                          <span>{item.title}</span>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Container>
      </section>

      <section className="lux-section shipping-section">
        <Container>
          <Row className="g-4">
            <Col xl={8}>
              <div className="shipping-panel">
                <div className="shipping-sectionHeader">
                  <div>
                    <div className="shipping-panel__eyebrow">How It Works</div>
                    <h2 className="shipping-panel__title">From checkout to doorstep</h2>
                  </div>
                  <Link to="/checkout" className="btn btn-outline-primary">
                    Continue to Checkout
                  </Link>
                </div>

                <div className="shipping-steps">
                  {STEPS.map((step) => (
                    <article key={step.index} className="shipping-stepCard">
                      <div className="shipping-stepCard__index">{step.index}</div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </article>
                  ))}
                </div>

                <div className="shipping-stepSummary">
                  {STEP_DETAILS.map((item) => (
                    <div key={item.label} className="shipping-stepSummary__item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            <Col xl={4}>
              <div className="shipping-panel">
                <div className="shipping-panel__eyebrow">Returns and Support</div>
                <h2 className="shipping-panel__title">Clear policies</h2>
                <div className="shipping-policyList">
                  {POLICIES.map((policy) => (
                    <article key={policy.title} className="shipping-policyCard">
                      <h3>{policy.title}</h3>
                      <p>{policy.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {isLoggedIn ? (
        <section className="lux-section shipping-section" style={{ paddingTop: 0 }}>
          <Container>
            <Row className="g-4">
              <Col xl={8}>
                <div className="shipping-panel">
                  <div className="shipping-sectionHeader">
                    <div>
                      <div className="shipping-panel__eyebrow">Live Tracking</div>
                      <h2 className="shipping-panel__title">Track your shipment like a real order</h2>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => setTrackingIndex((value) => Math.min(value + 1, TRACKING_CHECKPOINTS.length - 1))}
                    >
                      Next Scan
                    </button>
                  </div>

                  <div className="shipping-trackerHero">
                    <div>
                      <div className="shipping-trackerHero__eyebrow">Shipment Status</div>
                      <h3>{TRACKING_CHECKPOINTS[trackingIndex]}</h3>
                      <p>Tracking updates appear here as the parcel moves through each verified checkpoint.</p>
                    </div>
                    <div className="shipping-trackerMeta">
                      <span>Tracking number</span>
                      <strong>TRK-CAL-20491</strong>
                    </div>
                  </div>

                  <div className="shipping-progress">
                    <div className="shipping-progress__meta">
                      <span>Progress</span>
                      <span>{Math.round((trackingIndex / (TRACKING_CHECKPOINTS.length - 1)) * 100)}%</span>
                    </div>
                    <div className="shipping-progress__bar">
                      <div style={{ width: `${(trackingIndex / (TRACKING_CHECKPOINTS.length - 1)) * 100}%` }} />
                    </div>
                  </div>

                  <div className="shipping-checkpoints">
                    {TRACKING_CHECKPOINTS.map((checkpoint, index) => {
                      const state = index < trackingIndex ? 'done' : index === trackingIndex ? 'live' : 'pending';
                      return (
                        <div key={checkpoint} className={`shipping-checkpoint shipping-checkpoint--${state}`}>
                          <div className="shipping-checkpoint__dot">{index + 1}</div>
                          <span>{checkpoint}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Col>

              <Col xl={4}>
                <div className="shipping-panel">
                  <div className="shipping-panel__eyebrow">Recent Scans</div>
                  <h2 className="shipping-panel__title">Courier timeline</h2>
                  <div className="shipping-timeline">
                    {TRACKING_CHECKPOINTS.slice().reverse().map((item, index) => {
                      const actualIndex = TRACKING_CHECKPOINTS.length - 1 - index;
                      const state = actualIndex < trackingIndex ? 'done' : actualIndex === trackingIndex ? 'live' : 'pending';
                      return (
                        <article key={item} className={`shipping-timelineItem shipping-timelineItem--${state}`}>
                          <div className="shipping-timelineItem__top">
                            <span>{item}</span>
                            <small>{state === 'pending' ? 'Pending' : state === 'live' ? 'Live now' : 'Today'}</small>
                          </div>
                          <p>
                            {item === 'Placed' && 'Order confirmed and queued for verification.'}
                            {item === 'Packed' && 'Premium packaging completed at origin hub.'}
                            {item === 'Shipped' && 'Shipment is moving between verified courier hubs.'}
                            {item === 'Out for Delivery' && 'Parcel is with the final delivery partner.'}
                            {item === 'Delivered' && 'Order handoff marked successful.'}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      ) : null}
    </div>
  );
}

export default Shipping;
