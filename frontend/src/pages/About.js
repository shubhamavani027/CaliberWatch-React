import React, { useEffect, useMemo, useRef } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Home.css';
import './About.css';

function About() {
  const rootRef = useRef(null);

  const timeline = useMemo(
    () => [
      {
        year: '2010',
        title: 'The Genesis',
        description: 'Founded by watch enthusiasts with a commitment to precision and trust.',
      },
      {
        year: '2015',
        title: 'Global Presence',
        description: 'Expanded our curated selection and customer support to serve collectors worldwide.',
      },
      {
        year: '2018',
        title: 'Innovation Award',
        description: 'Recognized for pioneering digital authentication for luxury timepieces.',
      },
      {
        year: '2024',
        title: 'Caliber Digital',
        description: 'Launched our online destination for collectors and first-time buyers alike.',
      },
    ],
    []
  );

  const stats = useMemo(
    () => [
      { label: 'Timepieces Curated', value: '5,000+' },
      { label: 'Exquisite Brands', value: '45+' },
      { label: 'Global Clients', value: '12k+' },
      { label: 'Years of Heritage', value: '14' },
    ],
    []
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (!reduceMotion) {
      let raf = 0;
      const onScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const y = window.scrollY || 0;
          root.style.setProperty('--about-parallax', `${Math.min(180, y * 0.25)}px`);
        });
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
      };
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduceMotion) return;

    const els = Array.from(root.querySelectorAll('[data-reveal]'));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, threshold: 0.15 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="lux-page about-page">
      <section className="about-hero">
        <div className="about-hero__shade" aria-hidden="true" />
        <img src="/assets/about/hero.png" alt="Master watchmaker" className="about-hero__img" />

        <Container className="about-hero__content">
          <div className="lux-overline about-hero__kicker">Est. 2010</div>
          <h1 className="about-hero__title about-hero__reveal">
            Crafting <span className="lux-text-gold-gradient">Eternity.</span>
          </h1>
          <p className="about-hero__sub about-hero__reveal about-hero__reveal--delay">
            At Caliber, we do not just sell watches; we curate legacies through the art of fine horology.
          </p>
        </Container>
      </section>

      <div className="about-story-band">
        <video className="about-story__video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/images/homebottom.mp4" type="video/mp4" />
        </video>
        <div className="about-story__shade" aria-hidden="true" />

        <section className="lux-section about-story about-story--intro" style={{ paddingTop: 70 }}>
          <Container>
            <Row className="g-4 align-items-center">
              <Col lg={6}>
                <h2 className="about-title lux-reveal" data-reveal>
                  A Journey Through <span style={{ color: 'var(--luxury-gold)' }}>Precision</span>
                </h2>
                <p className="about-text lux-reveal" data-reveal>
                  Caliber was born from a deep passion for mechanical perfection. We built our standards around
                  transparency, authenticity, and the craft behind every movement.
                </p>
                <p className="about-text lux-reveal" data-reveal>
                  Today, we bridge tradition and the future, ensuring every tick of your timepiece echoes craftsmanship,
                  confidence, and lasting value.
                </p>
              </Col>
              <Col lg={6}>
                <div className="about-imageCard lux-reveal" data-reveal>
                  <img src="/assets/about/heritage.png" alt="Heritage" />
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="lux-section about-story about-story--timeline" style={{ paddingTop: 0 }}>
          <Container>
            <div className="lux-sectionHeader lux-reveal" data-reveal>
              <div className="lux-overline">Our Story</div>
              <h2 className="lux-sectionTitle">
                Milestones <span className="lux-text-gold-gradient">That Matter</span>
              </h2>
            </div>

            <Row className="g-4">
              {timeline.map((t) => (
                <Col md={6} lg={3} key={t.year}>
                  <Card className="about-timelineCard lux-reveal" data-reveal>
                    <Card.Body>
                      <div className="about-timelineCard__year">{t.year}</div>
                      <div className="about-timelineCard__title">{t.title}</div>
                      <div className="about-timelineCard__text">{t.description}</div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row className="g-4 mt-3">
              {stats.map((s) => (
                <Col md={3} sm={6} key={s.label}>
                  <div className="about-stat lux-reveal" data-reveal>
                    <div className="about-stat__value">{s.value}</div>
                    <div className="about-stat__label">{s.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      </div>

      <section className="about-cta">
        <img src="/assets/about/cta.png" alt="" className="about-cta__img" aria-hidden="true" />
        <div className="about-cta__shade" aria-hidden="true" />
        <Container className="text-center">
          <h2 className="about-cta__title lux-reveal is-visible" data-reveal>
            Ready to Start Your Legacy?
          </h2>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/watches" className="btn btn-primary">
              Explore The Collection
            </Link>
            <Link to="/brands" className="btn btn-outline-primary">
              Browse Brands
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

export default About;
