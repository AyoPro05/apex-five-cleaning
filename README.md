# Apex Five Cleaning

Professional cleaning services site for **apexfivecleaning.co.uk**: quotes, bookings, online payments, blog, and admin dashboard.

## Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, MongoDB
- **Payments:** Stripe
- **Auth:** JWT (customers), Bearer token (admin)

## Run locally

**1. Backend**

```bash
cd server
npm install
cp .env.example .env   # set MONGODB_URI, Stripe, etc.
npm run dev
```

API: `http://localhost:5001`

**2. Frontend**

```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL, etc.
npm run dev
```

App: `http://localhost:5173`

**Requires:** MongoDB (e.g. Atlas). Configure `server/.env` and `client/.env` from the `.env.example` files in each folder. Never commit real `.env` files or put secrets in source; see [docs/SECURITY.md](docs/SECURITY.md).

## Project layout

| Path | Purpose |
|------|--------|
| `client/` | React SPA (Vite). Static build → `client/dist` |
| `server/` | Express API, auth, quotes, payments, admin |
| `client/public/` | Static assets: favicon, logo, blog images, `robots.txt`, `sitemap.xml` |
| `docs/` | Deployment, SEO, security, email (reference only) |

## Documentation

- **Deploy & env:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **SEO (sitemap, Index Now):** [docs/SEO.md](docs/SEO.md)
- **Security overview:** [docs/SECURITY.md](docs/SECURITY.md)
- **Email (SMTP/SendGrid):** [docs/EMAIL.md](docs/EMAIL.md)

## License

Proprietary — Apex Five Cleaning.
