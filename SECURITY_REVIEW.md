# Security review (senior developer / analyst)

**Date:** Post-deployment review.  
**Scope:** Backend, frontend, and recent changes (payments, admin, email, captcha, GDPR delete, analytics).

---

## 1. What’s in place and working

### Backend

- **Security headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`.
- **CORS:** Explicit allowlist (localhost, CLIENT_URL, production domains, Render static URL). Credentials allowed only for those origins.
- **Rate limiting:** Global API (e.g. 100/15min), quote submission (5/24h), email-based quote limit. Stricter options available for sensitive routes.
- **Auth:** JWT for customer routes; admin routes protected by `ADMIN_TOKEN` (Bearer). Admin token sent only for `/api/admin/*` (frontend `apiClient`).
- **Payments:** No raw card data; Stripe PaymentIntents and Elements. Amount validation (min/max). Webhook signature verification when `STRIPE_WEBHOOK_SECRET` is set.
- **Quote submission:** reCAPTCHA v3 (server-side verify), Joi validation, file upload restricted to images (type/size), multer limits.
- **Email:** Config validated at startup; no secrets in `/health`. One sender config for all recipients.
- **GDPR delete:** DELETE user only for non-admin, only if account age ≥ configurable months (default 6). Referrals cleaned up; admin cannot be deleted via this route.
- **Health/root:** No secrets exposed; `/health` returns only email configured status and provider.

### Frontend

- **Admin vs customer auth:** Admin requests use only `adminToken`; customer JWT is not sent to `/api/admin/*`, so “Unauthorized” mix-up is avoided.
- **Stripe:** Card data handled by Stripe Elements (PCI). Separate fields (card number, expiry, CVC, postcode) with createPaymentMethod + confirmCardPayment.
- **401 handling:** Clears tokens on 401 so expired/invalid auth doesn’t persist.

### Recent changes verified

- Payment form: split Elements + postcode; flow (createPaymentMethod → confirmCardPayment) unchanged and working.
- Admin dashboard: analytics and delete customer are behind admin token; delete enforces retention and role checks on the server.
- Email/captcha: config checks and error handling in place; no regression to previously fixed behaviour.

---

## 2. Hardening applied in this review

- **Admin list APIs (users & quotes):**
  - **Sort field whitelist:** `sortBy` restricted to allowed fields (e.g. `createdAt`, `firstName`, `email`, …) to avoid prototype pollution or unintended sort keys.
  - **Search regex:** User search string is escaped before use in `RegExp` to reduce ReDoS and regex injection risk.
  - **Pagination caps:** `page` and `limit` bounded (e.g. limit max 100) to avoid excessive load or abuse.
- **CORS:** Render static site origin (`https://apex-five-cleaning-2.onrender.com`) added in production so the deployed frontend can call the API without CORS errors.

---

## 3. Recommendations (no breaking changes)

- **Admin auth:** Current admin check is a shared static token. For stronger security, consider moving to JWT (or similar) with short-lived tokens and refresh.
- **Stripe webhook:** Ensure `STRIPE_WEBHOOK_SECRET` is set in production and that the webhook endpoint verifies the signature for all Stripe events.
- **Secrets:** Keep all secrets in env (Render/local `.env`). No keys in repo or client bundle.
- **HTTPS:** In production, the app is behind Render (HTTPS). No change needed if you don’t serve the API directly over HTTP in production.
- **Uploads:** Quote images are stored under a fixed directory with generated filenames; no path traversal from client. Continue to serve uploads only from that controlled path.

---

## 4. Regression check

- Quote submit: validation, captcha, email flow, and success path unchanged.
- Pay Online: guest lookup, create-intent, confirm (with split card + postcode) and guest/confirm API unchanged; frontend only passes payment method and billing details.
- Admin: stats, quotes CRUD, customers list/export, analytics, and delete user behave as designed; list endpoints now use whitelisted sort and escaped search.
- Health/root: still no secrets; email status only.

Nothing in the hardening intentionally changes existing behaviour; it only tightens input handling and CORS.
