import useAttributionCapture from '../hooks/useAttributionCapture';

/** Invisible helper — runs attribution + page-view tracking. */
export default function AttributionCapture() {
  useAttributionCapture();
  return null;
}
