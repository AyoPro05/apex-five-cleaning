import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { COOKIE_NAMES, getJsonCookie, setJsonCookie } from '../utils/cookies';
import { initAnalytics } from '../utils/analytics';

const CookieConsentContext = createContext(null);

const defaultConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  decided: false,
  updatedAt: null,
};

export function CookieConsentProvider({ children }) {
  const [consent, setConsent] = useState(defaultConsent);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const stored = getJsonCookie(COOKIE_NAMES.CONSENT);
    if (stored && stored.decided) {
      setConsent(stored);
      initAnalytics(stored);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const persistConsent = useCallback((next) => {
    const payload = {
      ...next,
      essential: true,
      decided: true,
      updatedAt: new Date().toISOString(),
    };
    setJsonCookie(COOKIE_NAMES.CONSENT, payload, 365);
    setConsent(payload);
    initAnalytics(payload);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent({ essential: true, analytics: true, marketing: true, decided: true });
  }, [persistConsent]);

  const rejectNonEssential = useCallback(() => {
    persistConsent({ essential: true, analytics: false, marketing: false, decided: true });
  }, [persistConsent]);

  const savePreferences = useCallback((prefs) => {
    persistConsent({
      essential: true,
      analytics: Boolean(prefs.analytics),
      marketing: Boolean(prefs.marketing),
      decided: true,
    });
  }, [persistConsent]);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
    setShowBanner(true);
  }, []);

  const value = useMemo(
    () => ({
      consent,
      showBanner,
      showPreferences,
      setShowPreferences,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
    }),
    [
      consent,
      showBanner,
      showPreferences,
      acceptAll,
      rejectNonEssential,
      savePreferences,
      openPreferences,
    ],
  );

  return (
    <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return ctx;
}
