import React, { useEffect, useRef } from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Home.css';
import './Placeholder.css';

function Placeholder({ title, subtitle, bgVideo }) {
  const pageClass = title === 'Contact Us' ? 'placeholder-page--contact' : '';
  const videoRef = useRef(null);
  const encodedVideo = bgVideo ? encodeURI(bgVideo) : '';

  useEffect(() => {
    const videoEl = videoRef.current;

    if (!videoEl || !bgVideo) return;

    const startVideo = () => {
      if (title === 'Contact Us' && videoEl.duration && Number.isFinite(videoEl.duration)) {
        videoEl.currentTime = Math.min(1.2, Math.max(0, videoEl.duration * 0.08));
      }

      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    if (videoEl.readyState >= 2) startVideo();
    videoEl.addEventListener('loadeddata', startVideo);

    return () => {
      videoEl.removeEventListener('loadeddata', startVideo);
    };
  }, [bgVideo, title]);

  return (
    <div className="lux-page">
      <section
        className={`lux-section placeholder-page ${bgVideo ? 'placeholder-page--video' : ''} ${pageClass}`}
        style={{ paddingTop: 128 }}
      >
        {bgVideo ? (
          <>
            <video
              ref={videoRef}
              className="placeholder-page__video"
              src={encodedVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              defaultMuted
              aria-hidden="true"
            />
            <div className="placeholder-page__overlay" aria-hidden="true" />
          </>
        ) : null}
        <Container className="placeholder-page__container" style={{ maxWidth: 880, textAlign: 'center' }}>
          <div className="lux-overline">Caliber</div>
          <h1 className="lux-sectionTitle" style={{ fontSize: '2.9rem' }}>
            {title}
          </h1>
          <p className="lux-sectionSub" style={{ marginBottom: 28 }}>
            {subtitle || 'This page is coming soon. Meanwhile, explore the latest arrivals in our collection.'}
          </p>
          <Link to="/watches" className="btn btn-primary">
            Browse Watches
          </Link>
        </Container>
      </section>
    </div>
  );
}

export default Placeholder;
