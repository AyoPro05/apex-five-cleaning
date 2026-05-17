/**
 * Analytics & session tools — loaded only after user consent (UK PECR).
 */

let analyticsLoaded = false;
let marketingLoaded = false;

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || '';
const CLARITY_ID = import.meta.env.VITE_CLARITY_PROJECT_ID || '';

function injectScript(src, async = true) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.async = async;
  document.head.appendChild(script);
}

export function initAnalytics(consent = {}) {
  if (typeof window === 'undefined') return;

  if (consent.analytics && !analyticsLoaded) {
    if (GA_ID) {
      injectScript(`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', GA_ID, { anonymize_ip: true });
    }
    if (CLARITY_ID) {
      window.clarity =
        window.clarity ||
        function clarityFn() {
          (window.clarity.q = window.clarity.q || []).push(arguments);
        };
      injectScript(`https://www.clarity.ms/tag/${CLARITY_ID}`);
    }
    analyticsLoaded = true;
  }

  if (consent.marketing && !marketingLoaded) {
    // Reserved for Google Ads / Meta pixel when IDs are configured
    marketingLoaded = true;
  }
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (window.gtag && GA_ID) {
    window.gtag('event', eventName, params);
  }
}

export function trackPageView(path) {
  if (typeof window === 'undefined' || !GA_ID) return;
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
    });
  }
}
