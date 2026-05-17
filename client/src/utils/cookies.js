/**
 * First-party cookie helpers (UK PECR / GDPR — consent required for non-essential).
 */

const DEFAULT_PATH = '/';
const DEFAULT_SAME_SITE = 'Lax';

export const COOKIE_NAMES = {
  CONSENT: 'apex_consent',
  VISITOR_ID: 'apex_visitor_id',
  REFERRAL: 'apex_ref',
  UTM_SOURCE: 'apex_utm_source',
  UTM_MEDIUM: 'apex_utm_medium',
  UTM_CAMPAIGN: 'apex_utm_campaign',
  UTM_TERM: 'apex_utm_term',
  UTM_CONTENT: 'apex_utm_content',
  LANDING_PAGE: 'apex_landing_page',
  FIRST_VISIT: 'apex_first_visit',
  VISIT_COUNT: 'apex_visit_count',
  LAST_VISIT: 'apex_last_visit',
  SERVICE_INTEREST: 'apex_service_interest',
  SERVICE_REGION: 'apex_service_region',
  QUOTE_DRAFT: 'apex_quote_draft',
};

export function setCookie(name, value, days = 90, options = {}) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const sameSite = `; SameSite=${options.sameSite || DEFAULT_SAME_SITE}`;
  const path = `; path=${options.path || DEFAULT_PATH}`;
  const encoded = encodeURIComponent(String(value));
  document.cookie = `${name}=${encoded}; expires=${expires}${path}${sameSite}${secure}`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${DEFAULT_PATH}`;
}

export function setJsonCookie(name, value, days = 90) {
  setCookie(name, JSON.stringify(value), days);
}

export function getJsonCookie(name) {
  const raw = getCookie(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
