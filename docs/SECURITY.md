# Security Summary

- **Headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy.
- **CORS:** Allowlist of origins; credentials only where needed.
- **Rate limiting:** Global and per-route (e.g. quote submission capped).
- **Auth:** JWT for customers; admin uses short-lived JWTs obtained by exchanging `ADMIN_TOKEN` once via `POST /api/admin/login`. No long-lived static token on requests.
- **Payments:** Stripe only; no raw card data. Webhook handler always verifies Stripe signatures via `stripe.webhooks.constructEvent`; in production `STRIPE_WEBHOOK_SECRET` is required and requests are rejected if the secret is missing or signature invalid.
- **Quote form:** reCAPTCHA v3, Joi validation, image-only uploads with size limits.
- **Admin list APIs:** Sort/search/pagination sanitized (whitelist, escaped regex, caps).

Keep all secrets in env. In production, set `STRIPE_WEBHOOK_SECRET` and add the webhook URL in Stripe Dashboard; the handler rejects all webhook requests when the secret is not set or signature verification fails.

**Secrets and environment**

- **No keys in the repo:** All secrets (Stripe secret key, webhook secret, JWT secret, admin token, DB URL, SMTP/SendGrid, reCAPTCHA secret) must be set via environment variables only. Never commit `.env` or any file containing real keys; use `.env.example` as a template.
- **No secrets in the client bundle:** The frontend must only use `VITE_*` variables, which are embedded at build time. Only *publishable* or *public* values belong there (e.g. `VITE_STRIPE_PUBLIC_KEY`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_API_URL`). Never put server-side secrets, API secret keys, or signing secrets in client code or in any `VITE_*` env var.
- **Server:** All sensitive config lives in `server/.env` (or the host’s env). Not in source, not in the client.
