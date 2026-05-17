# Email configuration

One sender (SMTP or SendGrid) sends to any recipient domain. No per-customer config.

## IONOS SMTP (recommended for apexfivecleaning.co.uk)

Set these on your **API** service (Render → Environment):

| Variable | Example | Notes |
|----------|---------|--------|
| `EMAIL_PROVIDER` | `smtp` | Must be `smtp` |
| `SMTP_HOST` | `smtp.ionos.co.uk` | UK: `smtp.ionos.co.uk` — other regions: `smtp.ionos.com` |
| `SMTP_PORT` | `587` | Use `465` only with SSL (see below) |
| `SMTP_USER` | `info@apexfivecleaning.co.uk` | **Full mailbox email** (not just the domain) |
| `SMTP_PASS` | *(mailbox password)* | From IONOS → Email → your mailbox → password |
| `SMTP_FROM_EMAIL` | `info@apexfivecleaning.co.uk` | **Must match** an existing IONOS mailbox (or approved alias) |
| `SMTP_FROM_NAME` | `Apex Five Cleaning` | Display name |
| `CLIENT_URL` | `https://www.apexfivecleaning.co.uk` | Used in verification links (no trailing slash) |
| `NOTIFY_EMAIL` | `info@apexfivecleaning.co.uk` | Admin quote notifications |

### Port settings

- **587 (recommended):** `SMTP_PORT=587` — STARTTLS (app sets `secure=false`, `requireTLS=true`).
- **465:** `SMTP_PORT=465` — implicit SSL (`secure=true`).

### IONOS checklist if mail never arrives

1. **Render logs** (API service → Logs) after signup:
   - `✓ SMTP configured` and `✓ SMTP connection verified` → credentials OK at connect time.
   - `✓ Verification email sent to …` → app handed message to IONOS.
   - `❌ SMTP verify failed` or `Error sending verification email` → fix user/password/host/port.
2. **`SMTP_FROM_EMAIL`** must be the **same mailbox** as `SMTP_USER` (or a configured alias on that domain).
3. **DNS (IONOS → Domains → DNS):** add SPF and DKIM for your domain (IONOS Email setup wizard). Without SPF, Gmail/Yahoo often **silently drop** mail.
4. **IONOS Email logs:** IONOS control panel → Email → mailbox → check sent/outbound logs for bounces.
5. **`CLIENT_URL`** must be `https://www.apexfivecleaning.co.uk` so verification links are correct.
6. Test from production: `POST /api/admin/test-email` with admin JWT body `{ "to": "your@gmail.com" }`.

### Health check

`GET https://apex-five-cleaning-api.onrender.com/health`

```json
"email": { "configured": true, "provider": "smtp" }
```

If `configured: false`, SMTP env vars are missing on the API service.

## SendGrid (alternative)

- `EMAIL_PROVIDER=sendgrid`
- `SENDGRID_API_KEY=...`
- `SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk`

## General

- Never commit `server/.env` to git.
- Registration can succeed while email fails; the API returns `verificationStatus.emailSent: false` when send failed.
- `GET /health` shows email status without secrets.
