# Sentry Setup and Verification

## 1) Install SDKs

Run from repo root:

- `npm install --prefix "./client" @sentry/react`
- `npm install --prefix "./server" @sentry/node`

## 2) Configure environment variables

### Client (`client/.env`)

- `VITE_SENTRY_DSN=<your client DSN>`
- `VITE_SENTRY_ENVIRONMENT=production`
- `VITE_SENTRY_TRACES_SAMPLE_RATE=0.1`

### Server (`server/.env`)

- `SENTRY_DSN=<your server DSN>`
- `SENTRY_ENVIRONMENT=production`
- `SENTRY_TRACES_SAMPLE_RATE=0.1`

Optional for local/server verification:

- `ENABLE_SENTRY_TEST_ENDPOINT=true`

## 3) What is wired in code

- Client initialization: `client/src/monitoring/sentry.js`
- Client startup hook: `client/src/main.jsx`
- React boundary capture: `client/src/components/ErrorBoundary.jsx`
- Server initialization + middleware: `server/src/utils/sentry.js`
- Server wiring and global error capture: `server/src/index.js`

## 4) Verify client capture

1. Start client with a valid `VITE_SENTRY_DSN`.
2. Open `http://localhost:5173/__debug/sentry`.
3. Click **Trigger client test error**.
4. Confirm event appears in Sentry Issues.

## 5) Verify server capture

1. Start server with `SENTRY_DSN` and `ENABLE_SENTRY_TEST_ENDPOINT=true`.
2. Call:
   - `curl -i "http://localhost:5001/api/debug/sentry-test"`
3. Confirm issue appears in Sentry with message:
   - `Server Sentry test error`

## 6) Production checklist

- Set DSNs in deployment secrets, not in git.
- Keep sample rates conservative initially (0.05–0.1).
- Keep `ENABLE_SENTRY_TEST_ENDPOINT=false` in production.

