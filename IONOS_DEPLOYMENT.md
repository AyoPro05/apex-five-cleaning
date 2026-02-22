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

---

## Render static site: fix 404 on /pay-online and other routes (SPA)

The frontend is a single-page app (React Router). Direct requests to paths like `/pay-online` or `/request-a-quote` hit the static server, which has no file there, so you get **404**. Fix by telling Render to serve `index.html` for all those paths.

1. **Render Dashboard** → your **Static Site** (e.g. **apex-five-cleaning-2**) → **Settings**.
2. In the left sidebar, open **Redirects/Rewrites**.
3. Click **Add Rule**.
4. Set:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** **Rewrite** (not Redirect).
5. Save. Redeploy if needed.

After this, visiting `https://apex-five-cleaning-2.onrender.com/pay-online` will serve `index.html` and React Router will show the Pay Online page.

---

## IONOS DNS for Render (custom domain)

**Do not** use or change the `_domainconnect` record. That is for IONOS Domain Connect and is unrelated to pointing your domain to Render.

Add **two separate** DNS records as follows.

### 1. `www` subdomain (CNAME)

- **Type:** CNAME  
- **Host name:** `www` (only the word `www`, nothing else)  
- **Points to / Value:** `apex-five-cleaning-2.onrender.com`  
- **TTL:** 1 hour (or default)

So `www.apexfivecleaning.co.uk` will resolve to your Render static site.

### 2. Root domain `@` (A record)

Render’s root domain often cannot use a CNAME (many DNS providers don’t support CNAME on the root). Use an **A record** instead:

- **Type:** A  
- **Host name:** `@` (or leave empty if IONOS uses that for “root”)  
- **Points to / Value:** `216.24.57.1` (Render’s A record target; copy from Render’s “Add Custom Domain” modal if it shows a different IP)  
- **TTL:** 1 hour (or default)

So `apexfivecleaning.co.uk` (no www) will resolve to Render.

### Summary

| Purpose        | Type | Host name | Value / Points to                    |
|----------------|------|-----------|--------------------------------------|
| www subdomain  | CNAME| `www`     | `apex-five-cleaning-2.onrender.com`  |
| Root domain    | A    | `@`       | `216.24.57.1`                        |

Do **not** create or edit a CNAME for `_domainconnect` to point to Render. If IONOS shows a warning about disabling “Domain Connect” when you try to add the **www** CNAME, that is about their own service; adding the **www** CNAME and the **@** A record as above is correct for Render.
