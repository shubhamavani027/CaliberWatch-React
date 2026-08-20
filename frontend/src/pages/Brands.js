import React, { useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Home.css';
import './Brands.css';

const BRANDS = [
  {
    name: 'Rolex',
    description:
      'A pioneer in the development of the wristwatch, Rolex is at the origin of numerous major watchmaking innovations.',
    image: '/assets/brands/rolex.png',
  },
  {
    name: 'Patek Philippe',
    description: 'Renowned for creating some of the most complicated and prestigious watches in the world.',
    image: '/assets/brands/patek.png',
  },
  {
    name: 'Audemars Piguet',
    description: 'Independent master watchmakers since 1875, known for the iconic Royal Oak design.',
    image: '/assets/brands/ap.png',
  },
  {
    name: 'Omega',
    description:
      'A Swiss luxury watchmaker based in Biel/Bienne, Switzerland. One of the most recognized names in horology.',
    image: '/assets/brands/omega.png',
  },
];

function Brands() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BRANDS;
    return BRANDS.filter((b) => `${b.name} ${b.description}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="lux-page">
      <section className="lux-section brands-hero">
        <div className="brands-hero__bg" aria-hidden="true" />
        <Container>
          <div className="lux-sectionHeader">
            <div className="lux-overline">Curated Houses</div>
            <h1 className="lux-sectionTitle" style={{ fontSize: '2.9rem' }}>
              Explore Our <span className="lux-text-gold-gradient">Brands</span>
            </h1>
            <p className="lux-sectionSub">
              Caliber partners with respected watchmakers—so every collection you browse feels authentic, elevated, and
              timeless.
            </p>
          </div>

          <div className="brands-search lux-glass">
            <div className="brands-search__row">
              <div className="brands-search__input">
                <div className="brands-search__icon" aria-hidden="true">
                  ⌕
                </div>
                <Form.Control value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brands..." />
                <div className="brands-search__count">
                  {filtered.length}/{BRANDS.length}
                </div>
              </div>
              <Link to="/watches" className="btn btn-primary">
                Browse Watches
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="lux-section" style={{ paddingTop: 0 }}>
        <Container>
          <Row className="g-4">
            {filtered.map((brand) => (
              <Col md={6} key={brand.name}>
                <Card className="brand-card">
                  <div className="brand-card__imageWrap">
                    <img src={brand.image} alt={brand.name} className="brand-card__img" />
                  </div>
                  <Card.Body className="p-4 p-lg-5">
                    <div className="brand-card__name">{brand.name}</div>
                    <div className="brand-card__desc">{brand.description}</div>
                    <Link to={`/watches?brand=${encodeURIComponent(brand.name)}`} className="brand-card__link">
                      View Collection <span aria-hidden="true">→</span>
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {filtered.length === 0 && (
            <div className="text-center" style={{ color: 'var(--text-muted)', padding: '60px 0' }}>
              No brands match <span style={{ color: 'var(--text-primary)' }}>&quot;{query.trim()}&quot;</span>.
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}

export default Brands;
