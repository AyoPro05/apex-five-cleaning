import { useState } from 'react'

const DEFAULT_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='system-ui,-apple-system,sans-serif' font-size='24' fill='%236b7280' text-anchor='middle' dominant-baseline='middle'%3EImage unavailable%3C/text%3E%3C/svg%3E"

export default function FallbackImage({
  src,
  alt,
  fallbackSrc = DEFAULT_IMAGE_PLACEHOLDER,
  onError,
  ...props
}) {
  const [useFallback, setUseFallback] = useState(false)

  return (
    <img
      src={useFallback ? fallbackSrc : src}
      alt={alt}
      onError={(event) => {
        if (!useFallback) setUseFallback(true)
        onError?.(event)
      }}
      {...props}
    />
  )
}

