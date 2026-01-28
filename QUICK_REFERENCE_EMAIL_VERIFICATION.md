# 🚀 Email Verification Quick Reference

## For Developers

### File Locations
```
/server/
├── src/
│   ├── routes/emailVerification.js      # Email verification endpoints
│   ├── utils/emailService.js            # Email templates & sending logic
│   └── index.js                         # Routes integration
├── controllers/authController.js         # Updated registration
├── models/User.js                       # Has verification fields
└── EMAIL_VERIFICATION_GUIDE.md          # Full documentation
```

### Quick Test
```bash
# Terminal 1: Start backend
cd apex-five-cleaning/server
node src/index.js

# Terminal 2: Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName":"John",
    "lastName":"Doe",
    "email":"john@test.com",
    "phone":"1234567890",
    "password":"Password123!",
    "passwordConfirm":"Password123!"
  }'

# Check email for verification token
# Then verify:
curl -X POST http://localhost:3001/api/auth/verify-email-token \
  -H "Content-Type: application/json" \
  -d '{"token":"token_from_email"}'
```

### Key Functions

#### Send Verification Email
```javascript
import { sendVerificationEmail } from '../src/utils/emailService.js';

await sendVerificationEmail(
  userEmail,           // "user@example.com"
  firstName,           // "John"
  verificationToken    // from crypto.randomBytes(32).toString('hex')
);
```

#### Verify Email Token
```javascript
import crypto from 'crypto';

// Hash received token
const hashedToken = crypto.createHash('sha256')
  .update(receivedToken)
  .digest('hex');

// Compare with DB token
const user = await User.findOne({
  verificationToken: hashedToken,
  verificationTokenExpiry: { $gt: Date.now() }
});
```

#### Check Verification Status
```javascript
const user = await User.findById(userId);
console.log(user.isVerified);  // true/false
```

### Email Templates Used

1. **Verification Email** - Gets verification token
2. **Success Email** - After successful verification
3. **Resend Email** - When resending token

All templates include:
- Company branding (Apex Five Cleaning)
- Professional design
- Security notices
- Contact information

### Environment Variables Needed

```env
# Email Service
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
SMTP_FROM_EMAIL=noreply@apexfivecleaning.co.uk
SMTP_FROM_NAME=Apex Cleaning

# Frontend
CLIENT_URL=http://localhost:3000
```

### Frontend Integration Points

1. **Verify Email Page**
   ```javascript
   // Get token from URL: /verify-email?token=xxx
   const token = new URLSearchParams(location.search).get('token');
   
   // Call API
   fetch('http://localhost:3001/api/auth/verify-email-token', {
     method: 'POST',
     body: JSON.stringify({ token })
   });
   ```

2. **Resend Email Form**
   ```javascript
   // Simple email input form
   fetch('http://localhost:3001/api/auth/resend-verification-email', {
     method: 'POST',
     body: JSON.stringify({ email: userEmail })
   });
   ```

3. **Check Status**
   ```javascript
   fetch('http://localhost:3001/api/auth/verify-status', {
     headers: { 'Authorization': `Bearer ${token}` }
   });
   ```

### Security Notes

- ✅ Tokens hashed before storage
- ✅ Tokens expire after 24 hours
- ✅ Email addresses never sent in plain text URLs
- ✅ Rate limiting on all endpoints
- ✅ No password requests via email
- ✅ Account lockout after 5 failed logins

### Common Issues

**Email not sending?**
- Check SMTP credentials in .env
- Verify firewall allows port 587
- Check spam folder
- Try SendGrid instead: `EMAIL_PROVIDER=sendgrid`

**Token expired?**
- Tokens are valid for 24 hours
- Users can request resend
- New token is auto-generated

**User already verified?**
- Check `isVerified` field in DB
- Cannot verify twice
- Resend endpoint handles this gracefully

### Next Steps

1. Create frontend `/verify-email` page
2. Add email verification status widget
3. Create resend email form
4. Integrate with dashboard
5. Add password reset (same pattern)
6. Add booking confirmation emails

---

**Status:** ✅ Production Ready  
**Last Updated:** 27 January 2026
