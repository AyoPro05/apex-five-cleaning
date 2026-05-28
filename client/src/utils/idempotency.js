/**
 * Idempotency helpers — generate stable per-form keys to send via
 * X-Idempotency-Key. Combined with the backend idempotency middleware,
 * this prevents duplicate submissions on double-click / refresh after submit /
 * flaky network retries.
 */

export const IDEMPOTENCY_HEADER = "X-Idempotency-Key";

const FALLBACK_RE = /[xy]/g;

function fallbackUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(FALLBACK_RE, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a fresh idempotency key (UUID v4).
 * Use once per logical form submission (regenerate after a successful submit
 * if the same form will be reused for a different submission).
 */
export function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      return fallbackUuid();
    }
  }
  return fallbackUuid();
}

/**
 * Build an axios config object that attaches the idempotency header.
 * Merges with any existing headers on the passed config.
 */
export function withIdempotency(key, config = {}) {
  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      [IDEMPOTENCY_HEADER]: key,
    },
  };
}
