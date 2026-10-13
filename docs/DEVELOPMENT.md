# Development

Run commands from the repository root unless a working directory is specified.

## Prerequisites

- Node.js matching Vite's engine range: `^20.19.0 || >=22.12.0`.
- npm and a MongoDB database for API development.
- Stripe test credentials for payment testing.
- SMTP or SendGrid configuration for email testing.

## Setup

Install the locked dependencies:

```bash
npm ci --prefix client
npm ci --prefix server
```

Create the environment files only when they do not already exist:

```bash
cp -n client/.env.example client/.env
cp -n server/.env.example server/.env
```

Configure `client/.env` and `server/.env` using their templates. The frontend API URL for local development is `http://localhost:5001`. Keep credentials outside Git.

Start the API and frontend in separate terminals:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

The API uses port 5001; Vite uses port 5173 by default. Choose another frontend port when necessary:

```bash
npm run dev --prefix client -- --port 5174
```

## Checks

```bash
npm test --prefix client
npm test --prefix server
npm run build --prefix client
npm run build --prefix server
```

Frontend tests use Vitest and React Testing Library. Backend tests use Node.js's built-in test runner. Tests live beside the source they verify.

Run frontend tests continuously with `npm run test:watch --prefix client`. Preview the production frontend with `npm run preview --prefix client`.

## Source Layout

- `client/src/pages/`: public pages, account, quotes, payments and dashboards.
- `client/src/components/`: active shared UI and marketing controls.
- `client/src/data/`: service catalogues, area coverage and homepage FAQs.
- `server/src/index.js`: API and deployment entry point.
- `server/src/routes/` and `server/src/controllers/`: the active API implementation.
- `server/models/` and `server/src/models/`: database models used by the API.
- `server/middleware/auth.js`: shared authentication middleware.
- `server/src/middleware/`: validation, uploads, rate limiting and database middleware.
- `server/scripts/`: maintenance scripts; inspect their purpose before running.
- `docs/`: development, deployment, SEO, email and security references.

## Troubleshooting

For occupied ports, inspect the listener with `lsof -i :5001` or `lsof -i :5173` and stop the relevant development server normally, or choose another port.

For dependency problems, use `npm ci` in the relevant package. Preserve the committed lockfiles.

For API connection problems, check that the server is running and that `VITE_API_URL` matches its URL. For database problems, check `MONGODB_URI` and the database's access configuration.

For local Stripe webhooks, forward events to the existing API route:

```bash
stripe listen --forward-to localhost:5001/api/payments/webhook
```

See [Deployment](DEPLOYMENT.md), [Email](EMAIL.md), [Security](SECURITY.md) and [SEO](SEO.md) for service-specific configuration.
