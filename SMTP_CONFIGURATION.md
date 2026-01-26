# SMTP Configuration Guide

This guide covers configuring SMTP as your email provider for the Apex Five Cleaning quote system.

## Environment Variables

Your `.env` file should include these SMTP configuration variables:

```env
# Choose your email provider: 'sendgrid' or 'smtp'
EMAIL_PROVIDER=smtp

# SMTP Configuration (used if EMAIL_PROVIDER=smtp)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password-or-app-password
SMTP_FROM_NAME=Apex Five Cleaning
SMTP_FROM_EMAIL=no-reply@example.com

# Or use SendGrid (if EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk

# Notification Email
NOTIFY_EMAIL=admin@apexfivecleaning.co.uk
```

## Email Provider Setup Instructions

### Gmail SMTP

**Settings:**
- **SMTP_HOST**: `smtp.gmail.com`
- **SMTP_PORT**: `587`
- **SMTP_USER**: your.email@gmail.com
- **SMTP_PASS**: Your Gmail app password (NOT your main password)

**Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an [App Password](https://support.google.com/accounts/answer/185833)
3. Use the generated 16-character password as `SMTP_PASS`
4. In your `.env`:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   SMTP_FROM_NAME=Apex Five Cleaning
   SMTP_FROM_EMAIL=your.email@gmail.com
   ```

---

### Outlook/Office 365 SMTP

**Settings:**
- **SMTP_HOST**: `smtp-mail.outlook.com`
- **SMTP_PORT**: `587`
- **SMTP_USER**: your.email@outlook.com
- **SMTP_PASS**: Your Outlook password

**Steps:**
1. Ensure "Allow less secure apps" is enabled (if using older accounts)
2. In your `.env`:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp-mail.outlook.com
   SMTP_PORT=587
   SMTP_USER=your.email@outlook.com
   SMTP_PASS=your-password
   SMTP_FROM_NAME=Apex Five Cleaning
   SMTP_FROM_EMAIL=your.email@outlook.com
   ```

---

### AWS SES (Simple Email Service) SMTP

**Settings:**
- **SMTP_HOST**: `email-smtp.REGION.amazonaws.com` (e.g., eu-west-1)
- **SMTP_PORT**: `587` (or `465` for secure)
- **SMTP_USER**: Your SMTP username from AWS
- **SMTP_PASS**: Your SMTP password from AWS

**Steps:**
1. Go to AWS SES Console
2. Create SMTP credentials
3. Note the SMTP username and password
4. In your `.env`:
   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=AKIA...
   SMTP_PASS=your-generated-password
   SMTP_FROM_NAME=Apex Five Cleaning
   SMTP_FROM_EMAIL=verified-email@apexfivecleaning.co.uk
   ```

**Note:** The "from" email must be verified in AWS SES.

---

### SendGrid

**Settings:**
- **EMAIL_PROVIDER**: `sendgrid`
- **SENDGRID_API_KEY**: Your SendGrid API Key
- **SENDGRID_FROM_EMAIL**: Your verified sender email

**Steps:**
1. Create a SendGrid account
2. Generate an API Key in Settings > API Keys
3. Verify your sender email
4. In your `.env`:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=hello@apexfivecleaning.co.uk
   ```

---

### Custom SMTP Server

For your own mail server or any other provider:

1. Contact your email provider for SMTP settings
2. Typically you'll have:
   - SMTP Host (sometimes with port like `mail.example.com:587`)
   - SMTP Port (usually 587 for TLS or 465 for SSL)
   - Username (often your email address)
   - Password
3. Update your `.env` accordingly

---

## Testing Your Configuration

### Server Logs

When the server starts, you'll see:
- If SMTP: `✓ SMTP configured: smtp.gmail.com:587`
- If SendGrid: `✓ SendGrid initialized`
- If neither: `⚠️ No email provider configured`

### Test Email Sending

After submitting a quote through the form:
1. Check server logs for email sending confirmation
2. Verify customer email received confirmation
3. Verify admin email received notification

**Success message example:**
```
✓ Client confirmation email sent to customer@example.com via SMTP
✓ Admin notification email sent to admin@apexfivecleaning.co.uk via SMTP
```

---

## Troubleshooting

### "No email provider configured" warning
- **Cause**: Neither SMTP_HOST nor SENDGRID_API_KEY are set
- **Solution**: Add one of the email provider configurations above

### SMTP connection refused
- **Cause**: Wrong host, port, or credentials
- **Solution**:
  - Verify SMTP_HOST and SMTP_PORT are correct for your provider
  - Check username and password
  - Ensure your machine can reach the SMTP server (check firewall)

### Authentication failed
- **Cause**: Invalid username or password
- **Solution**:
  - For Gmail: Use App Password, not your main password
  - For Outlook: Ensure credentials are correct
  - For AWS SES: Verify SMTP username and password match

### "From" email rejected
- **Cause**: Sender email not verified
- **Solution**:
  - For SendGrid: Verify sender email in SendGrid dashboard
  - For AWS SES: Verify sender email in AWS SES console
  - For Gmail/Outlook: Use an email address you own

### Emails going to spam
- **Cause**: Missing SPF/DKIM records or authentication headers
- **Solution**:
  - Add SPF record: `v=spf1 include:smtp.example.com ~all`
  - Add DKIM records from your provider
  - Ensure proper "From" name and email address
  - Test with [Mail Tester](https://www.mail-tester.com/)

---

## Email Templates

Both providers use the same HTML email templates:
- **Customer confirmation**: Sent to customer after quote submission
- **Admin notification**: Sent to admin with quote details and verification data

Templates are defined in `server/src/utils/emailService.js`.

---

## Security Best Practices

1. **Never commit `.env` to version control**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template

2. **Use strong, unique passwords**
   - For SMTP credentials, use generated app passwords when available
   - Don't use personal passwords

3. **Limit API key scopes** (SendGrid)
   - Only grant necessary permissions
   - Rotate keys regularly

4. **Monitor email logs**
   - Check server logs for failed sends
   - Monitor bounce rates

5. **Use TLS/SSL** (SMTP)
   - Default port 587 uses STARTTLS
   - Port 465 uses implicit TLS
   - Both are secure

---

## Production Deployment

### Environment Variables on Production Server

1. **Do not copy `.env` file directly**
2. **Set environment variables on your hosting provider**:
   - Heroku: Use config vars
   - AWS: Use Systems Manager Parameter Store
   - Azure: Use Key Vault
   - DigitalOcean: Use App Platform environment variables
   - Other: Set via hosting provider's UI or CLI

3. **Example for Heroku**:
   ```bash
   heroku config:set EMAIL_PROVIDER=smtp
   heroku config:set SMTP_HOST=smtp.gmail.com
   heroku config:set SMTP_PORT=587
   heroku config:set SMTP_USER=your-email@gmail.com
   heroku config:set SMTP_PASS=xxxx xxxx xxxx xxxx
   heroku config:set SMTP_FROM_NAME="Apex Five Cleaning"
   heroku config:set SMTP_FROM_EMAIL=no-reply@apexfivecleaning.co.uk
   ```

---

## Monitoring

### Email Delivery Issues

Monitor these server logs:
- `✓ ... sent ... via SMTP`: Successful
- `❌ Error sending ... email`: Failed
- `⚠️ No email provider configured`: Missing config

### Email Bounce Rates

- Gmail: Check spam folder
- AWS SES: Monitor SNS notifications
- SendGrid: Use webhook to track bounces
- Outlook: Check junk folder

---

## FAQ

**Q: Can I switch between SendGrid and SMTP?**
A: Yes! Just change the `EMAIL_PROVIDER` environment variable.

**Q: Which is better, SendGrid or SMTP?**
A: 
- **SendGrid**: Managed, reliable, good deliverability, requires API key
- **SMTP**: More control, cheaper/free with existing email, requires proper configuration

**Q: Do I need both SendGrid and SMTP configured?**
A: No, configure only the one you'll use based on `EMAIL_PROVIDER`.

**Q: What if I want to switch providers later?**
A: Simply update the `EMAIL_PROVIDER` and corresponding env vars. No code changes needed.

---

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Email API](https://docs.sendgrid.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [AWS SES SMTP](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
- [SPF/DKIM Setup](https://dmarcian.com/)
