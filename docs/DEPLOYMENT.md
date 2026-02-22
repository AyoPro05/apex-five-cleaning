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

**Server** (`server/.env`): `NODE_ENV`, `PORT`, `CLIENT_URL`, `MONGODB_URI`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RECAPTCHA_SECRET_KEY`, `ADMIN_TOKEN`, `JWT_SECRET`, plus email vars (see `docs/EMAIL.md`).

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
