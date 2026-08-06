// Temporary middleware to help debug admin auth header presence in production.
// Enable by setting DEBUG_AUTH=true in the environment. Do NOT leave enabled
// in long-running production deployments — this is for short-term debugging only.

export default function logAuthHeader(req, res, next) {
  try {
    if (process.env.DEBUG_AUTH !== "true") return next();

    // Only log admin routes
    if (!req.path || !req.path.startsWith("/api/admin")) return next();

    const auth = (req.get("authorization") || "").trim();
    const present = auth.length > 0;
    const mask = (s) => {
      if (!s) return "";
      if (s.length <= 12) return s.replace(/.(?=.{4})/g, "*");
      return s.slice(0, 8) + "..." + s.slice(-4);
    };

    // Log minimal info — do NOT print full tokens
    console.log(
      `[auth-debug] ${req.method} ${req.originalUrl} ip=${req.ip} auth_present=${present} auth_mask=${mask(auth)}`,
    );
  } catch (err) {
    // never crash the request for debugging
    console.error("[auth-debug] logging failed:", err?.message || err);
  }

  return next();
}
