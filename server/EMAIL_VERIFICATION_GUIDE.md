# 📧 Email Verification System - Apex Five Cleaning

## Overview

Comprehensive email verification system with company-branded templates and secure token management. Ensures account security while maintaining professional communication standards.

---

## ✨ Features

### 1. **Company Branding**
- Apex Five Cleaning branded email headers
- Professional gradient design (Purple to Violet)
- Company logo and contact information
- Consistent styling across all emails

### 2. **Security Features**
- Secure token generation (32-byte random)
- SHA-256 token hashing
- 24-hour token expiry
- Automatic token cleanup on verification
- Account lockout protection on login attempts
- Ownership verification for API endpoints

### 3. **Email Types**
- **Verification Email**: Initial verification request
- **Verification Success**: Confirmation after successful verification
- **Resend Verification**: For expired or lost tokens

### 4. **Company Policy Compliance**
- Security notice in all emails
- Clear password security guidance
- Never requesting sensitive data via email
- Professional tone and formatting
- GDPR-compliant templates
- Proper data handling

---

## 🔧 Technical Implementation

### Email Service Architecture
```
emailService.js (ES Module)
├── Email Provider Support
│   ├── SMTP (Gmail, Office 365, custom servers)
│   └── SendGrid API
├── Template System
│   ├── Verification Email
│   ├── Success Email
│   └── Resend Email
└── Sending Functions
    ├── sendVerificationEmail()
    ├── sendVerificationSuccessEmail()
    └── sendResendVerificationEmail()
```

### Database Schema Updates
```javascript
User Schema additions:
- verificationToken: String (hashed)
- verificationTokenExpiry: Date
- isVerified: Boolean (default: false)
- verifiedAt: Date (optional)
```

### API Endpoints

#### 1. **Send Verification Email**
```
POST /api/auth/send-verification-email
Headers: Authorization: Bearer {accessToken}
Requires: User to be authenticated

Response (201):
{
  "success": true,
  "message": "Verification email sent successfully",
  "data": {
    "email": "user@example.com",
    "expiresIn": "24 hours"
  }
}
```

#### 2. **Verify Email with Token**
```
POST /api/auth/verify-email-token
Body: { "token": "verification_token" }

Response (200):
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "isVerified": true
    }
  }
}

Errors:
- 400: Invalid or expired token
- 404: User not found
```

#### 3. **Resend Verification Email**
```
POST /api/auth/resend-verification-email
Body: { "email": "user@example.com" }

Response (200):
{
  "success": true,
  "message": "If an account exists with this email, a verification link has been sent."
}

Note: Always returns 200 for security (doesn't reveal if email exists)
```

#### 4. **Check Verification Status**
```
GET /api/auth/verify-status
Headers: Authorization: Bearer {accessToken}
Requires: User to be authenticated

Response (200):
{
  "success": true,
  "data": {
    "isVerified": true,
    "email": "user@example.com",
    "verifiedAt": "2026-01-27T..."
  }
}
```

---

## 📧 Email Template Structure

### Verification Email
**Subject:** 🔐 Verify Your Email - Apex Five Cleaning

**Key Elements:**
- Company branding with gradient header
- Personalized greeting
- Clear verification button
- 24-hour expiry notice
- What happens next section
- Security notice
- Support contact information

**Styling:**
- Responsive design (mobile & desktop)
- Company color scheme (Purple #667eea to Violet #764ba2)
- Professional typography
- Clear call-to-action button

### Success Email
**Subject:** ✅ Email Verified - Welcome to Apex Five Cleaning!

**Key Elements:**
- Success confirmation with checkmark
- Next steps (booking services)
- Dashboard access link
- Service overview
- Professional closing

### Resend Email
**Subject:** 📧 New Verification Link - Apex Five Cleaning

**Key Elements:**
- Orange header for urgency awareness
- New verification link
- Troubleshooting tips
- Support contact information

---

## 🔒 Security Practices

### Token Generation & Storage
```javascript
// Server-side hashing
const verificationToken = crypto.randomBytes(32).toString('hex'); // Sent to user
const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex'); // Stored in DB

// Token validation
const userToken = crypto.createHash('sha256').update(receivedToken).digest('hex');
// Compare with stored hashedToken
```

### Protection Measures
1. **Token Hashing**: Tokens stored as SHA-256 hashes
2. **Expiry Time**: 24 hours automatic expiry
3. **One-Time Use**: Token deleted after verification
4. **No Email Enumeration**: Resend endpoint doesn't reveal account existence
5. **HTTPS Required**: Email links must use HTTPS
6. **Rate Limiting**: API rate limiting on all endpoints

---

## 🚀 Registration Flow with Email Verification

```
1. User registers
   ↓
2. POST /api/auth/register
   ├─ Create user (isVerified: false)
   ├─ Generate verification token
   ├─ Store hashed token with 24h expiry
   ├─ Send verification email
   └─ Return tokens + verification status
   ↓
3. User receives email
   ├─ Clicks verification link
   ├─ Redirected to /verify-email?token=xxx
   └─ Frontend calls verify endpoint
   ↓
4. POST /api/auth/verify-email-token
   ├─ Validate token & expiry
   ├─ Mark user as isVerified: true
   ├─ Delete token
   ├─ Send success email
   └─ Return success response
   ↓
5. User can now:
   ├─ Access member dashboard
   ├─ Book services
   ├─ Update profile
   └─ Receive notifications
```

---

## 📋 Configuration

### Environment Variables
```env
# Email Provider
EMAIL_PROVIDER=smtp          # or 'sendgrid'

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@apexfivecleaning.co.uk
SMTP_FROM_NAME=Apex Cleaning

# SendGrid Alternative
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@apexfivecleaning.co.uk

# Frontend
CLIENT_URL=http://localhost:3000  # For email links

# Token Expiry
JWT_EXPIRE=1h
JWT_REFRESH_EXPIRE=7d
```

### Gmail Configuration
1. Enable "Less secure apps" or use App Passwords
2. Create App Password in Google Account
3. Use App Password in SMTP_PASS
4. Allow "Less secure" apps if needed

---

## 🧪 Testing Email Verification

### Test Case 1: Register and Verify
```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "TestPassword123!",
    "passwordConfirm": "TestPassword123!"
  }'

# Response includes verification status and email sent confirmation
# Check email inbox for verification link
# Extract token from link

# 2. Verify Email
curl -X POST http://localhost:3001/api/auth/verify-email-token \
  -H "Content-Type: application/json" \
  -d '{"token": "extracted_token_from_email"}'

# Response: Email verified successfully!
```

### Test Case 2: Resend Verification
```bash
curl -X POST http://localhost:3001/api/auth/resend-verification-email \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

### Test Case 3: Check Status
```bash
curl -X GET http://localhost:3001/api/auth/verify-status \
  -H "Authorization: Bearer {accessToken}"
```

---

## 🎯 Company Policy Standards

### Data Privacy
- ✓ No password requests via email
- ✓ Token-based verification (not email confirmation links)
- ✓ Automatic token expiry
- ✓ GDPR compliant

### Professional Standards
- ✓ Company branding and logo
- ✓ Clear contact information
- ✓ Professional tone
- ✓ Multi-language support ready
- ✓ Accessibility guidelines

### Security Standards
- ✓ Token hashing (SHA-256)
- ✓ Expiry timeouts (24 hours)
- ✓ Rate limiting
- ✓ Email enumeration prevention
- ✓ Account lockout protection

---

## 🔄 Next Steps

1. **Frontend Integration**
   - Create /verify-email page component
   - Add token parsing from URL
   - Handle verification loading & errors
   - Show success message with dashboard redirect

2. **Password Reset** (Phase 5)
   - Similar token-based system
   - Forgot password flow
   - Reset email template
   - Security questions option

3. **Email Notifications** (Phase 6)
   - Booking confirmations
   - Reminders (24h, 2h before)
   - Receipt emails
   - Status updates

4. **Admin Features** (Phase 7)
   - Email verification logs
   - Resend capability
   - User verification status dashboard

---

## 📞 Support

**Email Verification Endpoints:**
- Primary: `POST /api/auth/verify-email-token`
- Resend: `POST /api/auth/resend-verification-email`
- Status: `GET /api/auth/verify-status`
- Manual: `POST /api/auth/send-verification-email`

**Company Contact:**
- 📧 support@apexfivecleaning.co.uk
- ☎️ 01227 XXXXXX
- 🌐 www.apexfivecleaning.co.uk

---

**Version:** 1.0.0  
**Last Updated:** 27 January 2026  
**Status:** ✅ Complete & Ready for Testing
