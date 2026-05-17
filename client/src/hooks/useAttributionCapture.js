import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { captureAttributionFromUrl } from '../utils/attribution';
import { trackPageView } from '../utils/analytics';
import { useCookieConsent } from '../context/CookieConsentContext';

/**
 * Captures UTM/referral cookies and tracks page views when analytics consent is given.
 */
export default function useAttributionCapture() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { consent } = useCookieConsent();

  useEffect(() => {
    captureAttributionFromUrl(searchParams, location.pathname);
  }, [searchParams, location.pathname]);

  useEffect(() => {
    if (consent.analytics && consent.decided) {
      trackPageView(location.pathname);
    }
  }, [location.pathname, consent.analytics, consent.decided]);
}
