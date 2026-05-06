# Deployment — apexfivecleaning.co.uk

Deploy to **www.apexfivecleaning.co.uk** (e.g. Vercel + Render, or IONOS).

## Build

```bash
# Client
cd client && npm install && npm run build

# Server
cd server && npm install
```

Host `client/dist` as the static site. Run the Node server as the API (or use a reverse proxy for both).

## Environment

**Server** (`server/.env`): `NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RECAPTCHA_SECRET_KEY`, `ADMIN_TOKEN`, **`JWT_SECRET`** (required in production – server will not start without it), plus email vars (see `docs/EMAIL.md`). Copy from `server/.env.example`.

**Client** (`client/.env`): `VITE_API_URL`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_STRIPE_PUBLIC_KEY`.

## SPA routing (Vercel / Render)

Direct hits to `/pay-online`, `/request-a-quote`, etc. must serve `index.html`.  
- **Vercel:** `vercel.json` already uses `client/dist`; add rewrites if needed.  
- **Render (static):** Settings → Redirects/Rewrites → add rule: Source `/*`, Destination `/index.html`, Action **Rewrite**.

## IONOS DNS (custom domain)

- **www:** CNAME `www` → your static host (e.g. `apex-five-cleaning-2.onrender.com`).
- **Root (@):** A record `@` → host’s IP (e.g. Render’s A record).
- Redirect `apexfivecleaning.co.uk` → `https://www.apexfivecleaning.co.uk` (301).

## Post-deploy

- [ ] HTTPS loads, redirect works
- [ ] Quote form, payments, reCAPTCHA work
- [ ] Stripe: webhook URL added in Dashboard (e.g. `https://your-api.example.com/api/payments/webhook`), signing secret copied to `STRIPE_WEBHOOK_SECRET` (required; handler rejects events without it)
- [ ] Set **JWT_SECRET** (and other secrets) in the host's environment (e.g. Render dashboard). Server will exit on start if `NODE_ENV=production` and `JWT_SECRET` is missing.
- [ ] Email: configure SMTP or SendGrid (see `docs/EMAIL.md`) so verification and password-reset links work. Links use `CLIENT_URL` with fallback to `https://www.apexfivecleaning.co.uk` if unset.
- [ ] **Uploads:** `server/uploads` is gitignored and ephemeral on Render. For persistent quote images, add cloud storage (e.g. S3) and switch uploads to that.
- [ ] **GDPR:** Customer delete in admin enforces 6-month retention (accounts younger than 6 months cannot be deleted). No action needed unless you previously used the temporary `force=true` bypass (now removed).
- [ ] Manual test: payments, email verification, forgot/reset password, admin dashboard, mobile layout, and accessibility (keyboard / screen reader).
