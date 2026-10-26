# Email configuration

One sender (SMTP or SendGrid) sends to any recipient domain. No per-customer config.

## Automated email logo

Branded emails attach `server/assets/apex-five-logo.png` inline and reference its Content-ID in the header. SMTP and SendGrid both receive the packaged image, so email clients do not need to fetch the logo from the website. `COMPANY_LOGO_URL` is no longer used. Deploy the API with the asset when applying this change; previously delivered messages keep their original HTML.

## Google review follow-up

The review email follows the owner's thank-you reference: a large centred heading, personalised cleaning message, generous spacing, and a wide rounded **Review Us on Google** button. It uses the existing Apex Five logo, green and teal palette, pale green background, and official contact footer. The logo remains embedded in delivered emails. The standalone [HTML preview](previews/review-email.html) works at desktop and mobile widths; the [mobile screenshot](previews/review-email-mobile.png) provides a quick visual reference. Both use a fictional customer and an embedded copy of the same logo.

All automated emails share one compact footer. The company email, main phone, WhatsApp, registered address and website appear once; social links use plain labels. Registered address and default contact details are maintained in `server/src/config/contact.js`. Customer details inside admin notifications are retained because they identify the enquiry.

The durable worker sends one review request per booking, after both the job's `completedAt` and a successful payment's `processedAt` are at least 48 hours old. For example, a job completed Monday at 10:00 and paid Tuesday at 14:00 becomes eligible Thursday at 14:00. Both customer booking payments and guest quote payments qualify. Unpaid, cancelled, refunded, incomplete, and already-contacted bookings are skipped. Failed email delivery stays retryable.

Mark delivered jobs **Completed** in the admin booking workflow. The owner's supplied Google link, `https://share.google/VHCntVtmEIBIasSi4`, is the default review destination. It currently redirects to a Google search for Apex Five Cleaning rather than opening the review form directly. Set `GOOGLE_REVIEW_URL` on the API host to override it with a direct review link, or explicitly set it empty to disable review requests. Unsetting the variable uses the owner's supplied link. If the API already has an older override, replace that value when deploying. The email invites an honest review from every eligible customer and includes a plain text link.

The hourly trigger is `.github/workflows/customer-follow-ups.yml`. It calls `GET /api/automation/run` with a bearer secret, so the API can remain on Vercel Hobby. Configure these settings before enabling it:

1. In the Vercel **backend** project, set a strong `CRON_SECRET` environment variable for production. Set `GOOGLE_REVIEW_URL` to the supplied Google link if an older or blank override exists. Redeploy the backend with these changes.
2. In GitHub → this repository → **Settings → Secrets and variables → Actions**, set the repository variable `APEX_API_URL` to the backend's stable production origin, without `/api/automation/run`. Set the Actions secret `APEX_CRON_SECRET` to the same value as Vercel's `CRON_SECRET`. Keep the secret out of repository files.
3. Merge the workflow onto the default branch. It runs at 17 minutes past each hour. Use the **Customer follow-ups** workflow's manual trigger only when ready to process eligible production customer messages.

Delivery happens on the first successful run after eligibility, normally around 48–49 hours. GitHub can delay scheduled jobs and disables public-repository schedules after 60 days without repository activity; see [GitHub scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule). Monitor the workflow's run history; HTTP errors and terminal automation failures fail the run.

The existing daily Vercel schedule at 08:00 UTC remains as a fallback. Both schedulers call the same durable queue and use its existing lease and delivery tracking. Hobby permits daily Vercel schedules only; see [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing). The obsolete in-process scheduler has been removed; all scheduled emails use the durable worker.

## IONOS SMTP (recommended for apexfivecleaning.co.uk)

Set these on your Vercel **backend** project (Settings → Environment Variables), then redeploy:

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
| `NOTIFY_EMAIL` | `info@apexfivecleaning.co.uk` | Admin quote notifications (inbox only — not shown to customers) |
| `COMPANY_EMAIL` | `info@apexfivecleaning.co.uk` | Contact email in verification and other customer emails |
| `COMPANY_TAGLINE` | `Professional Eco-Friendly Cleaning Services in UK` | Optional tagline in plain text account emails |

**Single mailbox:** Use `info@apexfivecleaning.co.uk` for `SMTP_USER`, `SMTP_FROM_EMAIL`, `COMPANY_EMAIL`, `NOTIFY_EMAIL`, and `CUSTOMER_FROM_EMAIL`. Do not use `admin@` or other addresses — only `info@` is active on IONOS.

Customer-facing emails display `COMPANY_EMAIL` only (not `NOTIFY_EMAIL`).

### Contact form (`POST /api/contact`)

Messages from the website **Contact** page are emailed to `NOTIFY_EMAIL` (default `info@apexfivecleaning.co.uk`). The customer's address is set as **Reply-To** so you can respond from your inbox.

### Port settings

- **587 (recommended):** `SMTP_PORT=587` — STARTTLS (app sets `secure=false`, `requireTLS=true`).
- **465:** `SMTP_PORT=465` — implicit SSL (`secure=true`).

### IONOS checklist if mail never arrives

1. **Vercel runtime logs** (backend project → Logs) after signup or a test email:
   - `✓ SMTP configured` means the app loaded SMTP settings; it does not confirm delivery or valid credentials.
   - Check email send errors for authentication, connection or TLS failures, then correct the user/password/host/port.
2. **`SMTP_FROM_EMAIL`** must be the **same mailbox** as `SMTP_USER` (or a configured alias on that domain).
3. **DNS (IONOS → Domains → DNS):** check SPF and DKIM using the IONOS Email setup instructions if messages are rejected or placed in spam.
4. **IONOS Email logs:** IONOS control panel → Email → mailbox → check sent/outbound logs for bounces.
5. **`CLIENT_URL`** must be `https://www.apexfivecleaning.co.uk` so verification links are correct.
6. Test from production: `POST /api/admin/test-email` with admin JWT body `{ "to": "your@gmail.com" }`.

### Health check

Request `GET /health` on the backend's production origin.

```json
"email": { "configured": true, "provider": "smtp" }
```

If `configured: false`, SMTP env vars are missing on the API service.

## SendGrid (alternative)

- `EMAIL_PROVIDER=sendgrid`
- `SENDGRID_API_KEY=...`
- `SENDGRID_FROM_EMAIL=info@apexfivecleaning.co.uk`

## General

- Never commit `server/.env` to git.
- Registration can succeed while email fails; the API returns `verificationStatus.emailSent: false` when send failed.
- `GET /health` shows email status without secrets.
