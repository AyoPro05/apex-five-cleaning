# Email Configuration Quick Start

## Setup in 3 Steps

### 1. Choose Your Email Provider

Edit `server/.env` and set:

```env
# Option A: Use SMTP (Gmail, Outlook, Custom)
EMAIL_PROVIDER=smtp

# Option B: Use SendGrid
EMAIL_PROVIDER=sendgrid
```

### 2. Add Credentials

For **SMTP** (example: Gmail):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password, not your main password
SMTP_FROM_NAME=Apex Five Cleaning
SMTP_FROM_EMAIL=your.email@gmail.com
```

For **SendGrid**:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk
```

### 3. Install Dependencies & Test

```bash
cd server
npm install
npm run dev
```

Watch for success message:
- ✓ SMTP configured: `smtp.gmail.com:587`
- ✓ SendGrid initialized

---

## Common Providers

| Provider | Host | Port | User | Password |
|----------|------|------|------|----------|
| **Gmail** | smtp.gmail.com | 587 | your@gmail.com | App password¹ |
| **Outlook** | smtp-mail.outlook.com | 587 | your@outlook.com | Your password |
| **AWS SES** | email-smtp.REGION.amazonaws.com² | 587 | SMTP username | SMTP password |
| **SendGrid** | N/A | N/A | N/A | API key |

¹ [Gmail App Password Setup](https://support.google.com/accounts/answer/185833)
² Replace REGION with your AWS region (e.g., eu-west-1)

---

## Verify It Works

1. Go to your quote form at http://localhost:3000/quote
2. Submit a quote
3. Check console for:
   ```
   ✓ Client confirmation email sent to customer@example.com via SMTP
   ✓ Admin notification email sent to admin@apexfivecleaning.co.uk via SMTP
   ```
4. Check your inbox for received emails

---

See [SMTP_CONFIGURATION.md](SMTP_CONFIGURATION.md) for detailed setup instructions.
