import React, { useMemo, useState } from 'react';

import { getPrimaryWatchImage, resolveMediaUrl } from '../utils/media';

function tryPlay(videoEl) {
  if (!videoEl) return;
  const p = videoEl.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
}

function WatchCardMedia({ watch, className, alt, posterFallbackSrc, fallbackSrc = '/assets/hero-watch.png' }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const posterSrc = useMemo(() => {
    const primary = watch ? getPrimaryWatchImage(watch) : null;
    const resolved = primary ? resolveMediaUrl(primary) : '';
    return resolved || posterFallbackSrc || '';
  }, [watch, posterFallbackSrc]);

  const videoSrc = useMemo(() => {
    if (!watch?.video) return '';
    return resolveMediaUrl(watch.video);
  }, [watch]);

  const imageSrc = useMemo(() => {
    const primary = watch ? getPrimaryWatchImage(watch) : null;
    return resolveMediaUrl(primary) || '';
  }, [watch]);

  const computedAlt = alt || watch?.title || 'Watch';

  if (videoSrc && !videoFailed) {
    return (
      <video
        className={className}
        src={videoSrc}
        poster={posterSrc || undefined}
        muted
        loop
        playsInline
        preload="metadata"
        onMouseEnter={(e) => tryPlay(e.currentTarget)}
        onFocus={(e) => tryPlay(e.currentTarget)}
        onMouseLeave={(e) => e.currentTarget.pause()}
        onBlur={(e) => e.currentTarget.pause()}
        onError={() => setVideoFailed(true)}
        aria-label={computedAlt}
      />
    );
  }

  const effectiveImgSrc = !imgFailed ? imageSrc : fallbackSrc;

  return (
    <img
      className={className}
      src={effectiveImgSrc}
      alt={computedAlt}
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  );
}

export default WatchCardMedia;
