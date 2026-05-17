import {
  COOKIE_NAMES,
  getCookie,
  setCookie,
  deleteCookie,
  getJsonCookie,
  setJsonCookie,
} from './cookies';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const UTM_COOKIE_MAP = {
  utm_source: COOKIE_NAMES.UTM_SOURCE,
  utm_medium: COOKIE_NAMES.UTM_MEDIUM,
  utm_campaign: COOKIE_NAMES.UTM_CAMPAIGN,
  utm_term: COOKIE_NAMES.UTM_TERM,
  utm_content: COOKIE_NAMES.UTM_CONTENT,
};

const ATTRIBUTION_DAYS = 90;
const VISITOR_DAYS = 730;

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/** Kent, London, Essex — from UK outward postcode district */
export function inferServiceRegion(postcode) {
  if (!postcode) return null;
  const district = String(postcode).trim().toUpperCase().replace(/\s+/g, '').match(/^[A-Z]{1,2}\d{1,2}[A-Z]?/)?.[0];
  if (!district) return null;

  const london = /^(E|EC|N|NW|SE|SW|W|WC)\d/;
  const essex = /^(CM|CO|SS|IG|RM)\d/;
  const kent = /^(CT|DA|ME|TN|BR)\d/;

  if (london.test(district)) return 'London';
  if (essex.test(district)) return 'Essex';
  if (kent.test(district)) return 'Kent';
  return 'Other';
}

export function computeLeadSource(attribution = {}) {
  const { referralCode, utmSource, utmMedium, utmCampaign } = attribution;
  if (referralCode) return `Referral (${referralCode})`;
  if (utmSource) {
    const parts = [utmSource, utmMedium, utmCampaign].filter(Boolean);
    return parts.join(' / ');
  }
  const landing = attribution.landingPage || '';
  if (landing.includes('/blog')) return 'Blog';
  if (landing.includes('/service-areas')) return 'Service areas';
  if (landing.includes('/services')) return 'Services';
  return 'Direct / organic';
}

/**
 * Call on app load and when URL search params change (UTM, ref).
 */
export function captureAttributionFromUrl(searchParams, pathname = '/') {
  if (typeof window === 'undefined') return;

  let visitorId = getCookie(COOKIE_NAMES.VISITOR_ID);
  if (!visitorId) {
    visitorId = randomId();
    setCookie(COOKIE_NAMES.VISITOR_ID, visitorId, VISITOR_DAYS);
    setCookie(COOKIE_NAMES.FIRST_VISIT, new Date().toISOString(), VISITOR_DAYS);
    setCookie(COOKIE_NAMES.VISIT_COUNT, '1', VISITOR_DAYS);
  } else {
    const count = parseInt(getCookie(COOKIE_NAMES.VISIT_COUNT) || '0', 10) + 1;
    setCookie(COOKIE_NAMES.VISIT_COUNT, String(count), VISITOR_DAYS);
  }
  setCookie(COOKIE_NAMES.LAST_VISIT, new Date().toISOString(), VISITOR_DAYS);

  if (!getCookie(COOKIE_NAMES.LANDING_PAGE)) {
    setCookie(COOKIE_NAMES.LANDING_PAGE, pathname || '/', ATTRIBUTION_DAYS);
  }

  const ref = searchParams?.get?.('ref') || searchParams?.get?.('referral');
  if (ref) {
    setCookie(COOKIE_NAMES.REFERRAL, String(ref).trim().toUpperCase(), ATTRIBUTION_DAYS);
  }

  UTM_KEYS.forEach((key) => {
    const val = searchParams?.get?.(key);
    if (val) {
      setCookie(UTM_COOKIE_MAP[key], val, ATTRIBUTION_DAYS);
    }
  });
}

export function setServiceInterest(serviceType) {
  if (serviceType) {
    setCookie(COOKIE_NAMES.SERVICE_INTEREST, serviceType, ATTRIBUTION_DAYS);
  }
}

export function setServiceRegionFromPostcode(postcode) {
  const region = inferServiceRegion(postcode);
  if (region) {
    setCookie(COOKIE_NAMES.SERVICE_REGION, region, 365);
  }
  return region;
}

export function getAttributionPayload() {
  const attribution = {
    visitorId: getCookie(COOKIE_NAMES.VISITOR_ID) || null,
    referralCode: getCookie(COOKIE_NAMES.REFERRAL) || null,
    utmSource: getCookie(COOKIE_NAMES.UTM_SOURCE) || null,
    utmMedium: getCookie(COOKIE_NAMES.UTM_MEDIUM) || null,
    utmCampaign: getCookie(COOKIE_NAMES.UTM_CAMPAIGN) || null,
    utmTerm: getCookie(COOKIE_NAMES.UTM_TERM) || null,
    utmContent: getCookie(COOKIE_NAMES.UTM_CONTENT) || null,
    landingPage: getCookie(COOKIE_NAMES.LANDING_PAGE) || null,
    firstVisitAt: getCookie(COOKIE_NAMES.FIRST_VISIT) || null,
    visitCount: parseInt(getCookie(COOKIE_NAMES.VISIT_COUNT) || '0', 10) || 0,
    serviceInterest: getCookie(COOKIE_NAMES.SERVICE_INTEREST) || null,
    serviceRegion: getCookie(COOKIE_NAMES.SERVICE_REGION) || null,
  };
  attribution.leadSource = computeLeadSource(attribution);
  return attribution;
}

const DRAFT_KEYS = [
  'propertyType',
  'bedrooms',
  'bathrooms',
  'serviceType',
  'additionalServices',
  'step',
];

export function saveQuoteDraft(formSlice) {
  const draft = {};
  DRAFT_KEYS.forEach((key) => {
    if (formSlice[key] !== undefined && formSlice[key] !== '') {
      draft[key] = formSlice[key];
    }
  });
  if (Object.keys(draft).length === 0) return;
  draft.savedAt = new Date().toISOString();
  setJsonCookie(COOKIE_NAMES.QUOTE_DRAFT, draft, 7);
}

export function loadQuoteDraft() {
  return getJsonCookie(COOKIE_NAMES.QUOTE_DRAFT);
}

export function clearQuoteDraft() {
  deleteCookie(COOKIE_NAMES.QUOTE_DRAFT);
}
