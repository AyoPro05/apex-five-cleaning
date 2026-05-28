/**
 * IDEMPOTENCY MIDDLEWARE
 *
 * Prevents duplicate side-effects (extra DB rows, emails, payment intents)
 * when a client retries the same operation (double-click, refresh after submit,
 * flaky network).
 *
 * Usage:
 *   router.post('/submit', idempotency(), rateLimiter, handler)
 *
 * Behaviour:
 *   - Reads X-Idempotency-Key request header.
 *   - If absent or invalid → request proceeds normally (no breaking change).
 *   - If present and matches a cached successful response within the TTL,
 *     the cached 2xx JSON response is replayed without re-running the handler.
 *   - Only 2xx JSON responses are cached. Errors are not cached so users can
 *     retry after fixing input.
 *
 * Notes:
 *   - In-memory cache (single-process). For multi-instance deployments,
 *     replace cache with Redis. Render currently runs single-instance per
 *     service tier so this is sufficient.
 *   - Cache key is scoped by method + path so the same UUID can be reused
 *     across different forms without collision.
 *   - Periodic cleanup keeps memory bounded.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ENTRIES = 5000;
const HEADER_LOWER = 'x-idempotency-key';
const cache = new Map();

function isValidKey(key) {
  return (
    typeof key === 'string' &&
    key.length >= 8 &&
    key.length <= 128 &&
    /^[A-Za-z0-9_\-:.]+$/.test(key)
  );
}

function cleanup() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (value.expiresAt <= now) {
      cache.delete(key);
    }
  }
  // If still over the limit, evict oldest entries (Map preserves insertion order)
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (!oldest) break;
    cache.delete(oldest);
  }
}

// Background cleanup every 60s (unref so it doesn't block process exit)
const interval = setInterval(cleanup, 60 * 1000);
if (interval.unref) interval.unref();

/**
 * @param {{ ttlMs?: number }} [options]
 */
export function idempotency(options = {}) {
  const ttl = options.ttlMs || DEFAULT_TTL_MS;

  return function idempotencyMiddleware(req, res, next) {
    const key = req.get(HEADER_LOWER);
    if (!isValidKey(key)) {
      return next();
    }

    const scopedKey = `${req.method}:${req.baseUrl}${req.path}:${key}`;
    const cached = cache.get(scopedKey);

    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader('X-Idempotent-Replay', 'true');
      return res.status(cached.statusCode).json(cached.body);
    }

    // Intercept res.json to capture the first successful response
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (cache.size >= MAX_ENTRIES) cleanup();
          cache.set(scopedKey, {
            statusCode: res.statusCode,
            body,
            expiresAt: Date.now() + ttl,
          });
        }
      } catch {
        // Never fail a real response because of caching
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Test helper to clear the cache (used in tests if added later).
 */
export function _clearIdempotencyCache() {
  cache.clear();
}
