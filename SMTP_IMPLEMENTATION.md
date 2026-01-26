# SMTP Support Implementation Summary

## Overview

SMTP support has been added to the Apex Five Cleaning quote system as an alternative to SendGrid. The system now supports both email providers with flexible, environment-based configuration.

## Changes Made

### 1. **Updated Email Service** (`server/src/utils/emailService.js`)
- ✅ Added Nodemailer import for SMTP support
- ✅ Added EMAIL_PROVIDER configuration (read from `process.env.EMAIL_PROVIDER`)
- ✅ Dual initialization:
  - SendGrid via `@sendgrid/mail` if provider = 'sendgrid'
  - SMTP via `nodemailer` if provider = 'smtp'
- ✅ Enhanced `sendClientConfirmationEmail()` to support both providers
- ✅ Enhanced `sendAdminNotificationEmail()` to support both providers
- ✅ Added intelligent provider detection with fallback
- ✅ Added detailed console logging for debugging

### 2. **Updated Configuration** (`server/.env.example`)
- ✅ Added `EMAIL_PROVIDER` variable (accepts 'sendgrid' or 'smtp')
- ✅ Added SMTP configuration variables:
  - `SMTP_HOST` - SMTP server hostname
  - `SMTP_PORT` - SMTP server port (587 for TLS, 465 for SSL)
  - `SMTP_USER` - SMTP username
  - `SMTP_PASS` - SMTP password or app password
  - `SMTP_FROM_NAME` - Sender display name
  - `SMTP_FROM_EMAIL` - Sender email address
- ✅ Kept SendGrid variables for backward compatibility:
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`
- ✅ Added `NOTIFY_EMAIL` variable for admin notifications
- ✅ Added helpful comments and examples for common providers

### 3. **Updated Dependencies** (`server/package.json`)
- ✅ Added `nodemailer: ^6.9.7` to dependencies
- ✅ Maintains all existing dependencies

## How It Works

### Provider Selection

The system automatically detects which email provider to use:

```javascript
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp';
```

### Email Sending Flow

**When sending an email:**

1. Check `EMAIL_PROVIDER` environment variable
2. If 'sendgrid' and SENDGRID_API_KEY exists:
   - Use SendGrid API
   - Log: "✓ ... sent ... via SendGrid"
3. Else if 'smtp' and SMTP_HOST exists:
   - Use Nodemailer SMTP transport
   - Log: "✓ ... sent ... via SMTP"
4. Else:
   - Warn: "⚠️ No email provider configured"
   - Return error

### Configuration Examples

**Gmail SMTP:**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM_NAME=Apex Five Cleaning
SMTP_FROM_EMAIL=your.email@gmail.com
```

**SendGrid:**
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk
```

**AWS SES:**
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIA...
SMTP_PASS=your-generated-password
SMTP_FROM_NAME=Apex Five Cleaning
SMTP_FROM_EMAIL=verified-email@apexfivecleaning.co.uk
```

## Documentation Created

### 1. **SMTP_CONFIGURATION.md** (Comprehensive Guide)
- Detailed setup instructions for each provider
- Troubleshooting section
- Security best practices
- Production deployment guidelines
- FAQ

Covers:
- Gmail SMTP setup
- Outlook/Office 365 SMTP setup
- AWS SES SMTP setup
- SendGrid setup
- Custom SMTP servers
- Testing procedures
- Monitoring and logging

### 2. **EMAIL_SETUP.md** (Quick Start Guide)
- 3-step setup process
- Provider comparison table
- Quick verification steps

## Features

✅ **Flexible Configuration**
- Switch between SendGrid and SMTP without code changes
- Simple environment variable configuration

✅ **Backward Compatible**
- Existing SendGrid setups continue to work
- No breaking changes to API

✅ **Intelligent Fallback**
- Checks provider availability
- Clear error messages when misconfigured

✅ **Rich Logging**
- Console logging shows which provider is used
- Timestamps and status indicators

✅ **Security**
- Supports TLS (port 587) and SSL (port 465)
- No credentials hardcoded in code
- Environment-based configuration only

✅ **Support for Multiple SMTP Providers**
- Gmail
- Outlook/Office 365
- AWS SES
- Custom SMTP servers
- Any SMTP-compatible service

## Testing

### Server Startup Verification

When the server starts, you should see one of:

```
✓ SendGrid initialized
```

or

```
✓ SMTP configured: smtp.gmail.com:587
```

### Quote Submission Test

1. Visit http://localhost:3000/quote
2. Fill in the form and submit
3. Check server console for:
   ```
   ✓ Client confirmation email sent to customer@email.com via SMTP
   ✓ Admin notification email sent to admin@email.com via SMTP
   ```
4. Verify emails received in inboxes

## Environment Variables Reference

| Variable | Required | Provider | Example |
|----------|----------|----------|---------|
| EMAIL_PROVIDER | Yes | Both | `smtp` or `sendgrid` |
| SMTP_HOST | SMTP only | SMTP | `smtp.gmail.com` |
| SMTP_PORT | SMTP only | SMTP | `587` |
| SMTP_USER | SMTP only | SMTP | `user@gmail.com` |
| SMTP_PASS | SMTP only | SMTP | `app-password` |
| SMTP_FROM_NAME | SMTP only | SMTP | `Apex Five Cleaning` |
| SMTP_FROM_EMAIL | SMTP only | SMTP | `noreply@example.com` |
| SENDGRID_API_KEY | SG only | SendGrid | `SG.xxx...` |
| SENDGRID_FROM_EMAIL | SG only | SendGrid | `hello@example.com` |
| NOTIFY_EMAIL | Optional | Both | `admin@example.com` |
| ADMIN_EMAIL | Optional | Both | `admin@example.com` |

## Migration Guide

### From SendGrid to SMTP

1. Update `.env`:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_NAME=Apex Five Cleaning
   SMTP_FROM_EMAIL=your.email@gmail.com
   ```

2. Restart server:
   ```bash
   npm run dev
   ```

3. Verify in console:
   ```
   ✓ SMTP configured: smtp.gmail.com:587
   ```

4. Test with quote submission

### From SMTP to SendGrid

1. Update `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=hello@example.com
   ```

2. Restart server
3. Verify in console:
   ```
   ✓ SendGrid initialized
   ```

## Production Checklist

- [ ] Set `EMAIL_PROVIDER` on production server
- [ ] Configure email service credentials (SMTP or SendGrid)
- [ ] Set `NOTIFY_EMAIL` to your admin email
- [ ] Set `CLIENT_URL` to production domain
- [ ] Test email sending with test quote
- [ ] Verify emails don't go to spam
- [ ] Set up monitoring for failed sends
- [ ] Document email provider choice for your team

## Troubleshooting

**"No email provider configured" warning**
→ Check that either `SMTP_HOST` or `SENDGRID_API_KEY` is set

**SMTP connection refused**
→ Verify SMTP_HOST and SMTP_PORT are correct for your provider

**Authentication failed**
→ For Gmail, use App Password (not your main password)

**Emails going to spam**
→ Configure SPF/DKIM records in DNS

See [SMTP_CONFIGURATION.md](SMTP_CONFIGURATION.md) for detailed troubleshooting.

## Files Modified

```
server/
├── src/
│   └── utils/
│       └── emailService.js          ✅ Updated for SMTP support
├── .env.example                      ✅ Updated with SMTP variables
└── package.json                      ✅ Added nodemailer dependency

Root:
├── SMTP_CONFIGURATION.md             ✅ New comprehensive guide
└── EMAIL_SETUP.md                    ✅ New quick start guide
```

## Support Matrix

| Feature | SMTP | SendGrid |
|---------|------|----------|
| Email sending | ✅ | ✅ |
| Customer confirmation | ✅ | ✅ |
| Admin notification | ✅ | ✅ |
| HTML templates | ✅ | ✅ |
| TLS encryption | ✅ | ✅ |
| Multiple providers | ✅ | ✅ |
| Free tier | ✅ (varies) | ✅ |
| Setup difficulty | Medium | Low |

---

## Summary

The Apex Five Cleaning quote system now supports both SMTP and SendGrid for email delivery. Simply configure your preferred provider via environment variables and the system will automatically use the correct service. No code changes required for switching providers.
