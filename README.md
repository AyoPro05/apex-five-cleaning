# Apex Five Cleaning

Professional cleaning services website – quotes, bookings, payments, admin dashboard.

## Run locally

**Backend**
```bash
cd server
npm install
cp .env.example .env   # configure as needed
npm run dev
```
→ `http://localhost:5001`

**Frontend**
```bash
cd client
npm install
cp .env.example .env   # configure as needed
npm run dev
```
→ `http://localhost:5173`

**Requires:** MongoDB. Set `MONGODB_URI` in `server/.env`.

## Environment

- `server/.env.example` – backend config (DB, Stripe, email, reCAPTCHA)
- `client/.env.example` – frontend config (API URL, reCAPTCHA, Stripe publishable key)

## Tech stack

React, Vite, Tailwind | Node.js, Express, MongoDB, Stripe, JWT
