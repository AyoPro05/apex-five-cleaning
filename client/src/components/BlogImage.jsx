import { useState } from 'react';

/** Placeholder when external image fails to load (e.g. Unsplash rate limit or network) */
const FALLBACK_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Crect fill='%23e5e7eb' width='800' height='400'/%3E%3Ctext fill='%239ca3af' font-family='system-ui' font-size='18' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E";

/**
 * Blog image with fallback on error and optional eager load for above-the-fold.
 * Uses referrerPolicy to avoid external (e.g. Unsplash) blocking by referrer.
 */
export default function BlogImage({ src, alt, className = '', loading = 'lazy', ...props }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const effectiveSrc = error ? FALLBACK_PLACEHOLDER : src;

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      className={`${className} ${!loaded && !error ? 'bg-gray-200' : ''}`}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      {...props}
    />
  );
}
