# IONOS Deployment Guide — apexfivecleaning.co.uk

Deploy Apex Five Cleaning to IONOS with domain **www.apexfivecleaning.co.uk**.

---

## Pre-Deployment Checklist

### Security & standards (codebase)

- [x] Canonical URL & meta tags use `https://www.apexfivecleaning.co.uk`
- [x] CORS allows `www` and non-www origins in production
- [x] Stripe requires `STRIPE_SECRET_KEY` in production (no fallback)
- [x] Share URLs use full `https://` and `encodeURIComponent`
- [x] `.env` files in `.gitignore` (never commit secrets)
- [x] Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- [x] API rate limiting enabled

### Domain / IONOS setup

1. **DNS** (IONOS control panel → Domains → apexfivecleaning.co.uk → DNS):
   - A record: `@` → your server IP
   - A record: `www` → same server IP (or CNAME to `apexfivecleaning.co.uk`)
   - Optional: CNAME `api` → same server if using subdomain for API

2. **SSL**  
   - Enable SSL on IONOS (Let’s Encrypt or paid cert) so the site is served over `https://`.
   - If hosting yourself, use a reverse proxy (e.g. nginx) with Let’s Encrypt.

3. **Redirect**  
   - Configure `apexfivecleaning.co.uk` → `https://www.apexfivecleaning.co.uk` (301 permanent).

---

## Environment Variables

### Server (production)

Create `server/.env` with:

```
NODE_ENV=production
PORT=5001
CLIENT_URL=https://www.apexfivecleaning.co.uk
MONGODB_URI=mongodb+srv://...  # Atlas or your DB
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RECAPTCHA_SECRET_KEY=...
ADMIN_TOKEN=<strong-random-token>
JWT_SECRET=<strong-random-token>
# Email, company URLs, etc. from server/.env.example
```

### Client (build)

Create `client/.env`:

```
VITE_API_URL=https://www.apexfivecleaning.co.uk
VITE_RECAPTCHA_SITE_KEY=...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
```

---

## Build & Run

```bash
# Client
cd client
npm install
npm run build

# Server
cd server
npm install
```

Host `client/dist` with the static server of your choice and run the Node server as your API (or use a reverse proxy to serve both).

---

## IONOS hosting options

1. **IONOS Web Hosting** – upload built client files (e.g. via FTP) and run Node.js if supported.
2. **IONOS VPS** – Node.js + nginx (or similar) on a VPS; point DNS to the VPS IP.
3. **External host + IONOS DNS** – host on Vercel/Railway/Render and point IONOS DNS records to that host.

---

## Post-deploy checks

- [ ] `https://www.apexfivecleaning.co.uk` loads
- [ ] `https://apexfivecleaning.co.uk` redirects to `https://www.apexfivecleaning.co.uk`
- [ ] Forms, quotes, payments work
- [ ] reCAPTCHA works on quote form
- [ ] Stripe webhooks point to your production URL
