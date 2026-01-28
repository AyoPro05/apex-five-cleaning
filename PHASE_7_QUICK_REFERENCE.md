# Phase 7: Quick Reference Guide

## 📊 Summary

**Phase**: 7 - Backend Payment Controller & Webhook Integration  
**Status**: ✅ **COMPLETE**  
**Date**: January 28, 2026  
**Commit**: d559219

---

## 🎯 What Was Built

### Backend Components (3)

#### 1. Payment Controller
**File**: `/server/src/controllers/paymentController.js` (600+ lines)

**Functions**:
```javascript
createPaymentIntent(req, res)      // POST /api/payments/create-intent
confirmPayment(req, res)           // POST /api/payments/confirm
getPaymentDetails(req, res)        // GET /api/payments/:paymentId
getPaymentHistory(req, res)        // GET /api/payments
refundPayment(req, res)            // POST /api/payments/:paymentId/refund
```

#### 2. Webhook Handler
**File**: `/server/src/routes/webhooks.js` (550+ lines)

**Events**:
```javascript
payment_intent.succeeded           // Payment successful
payment_intent.payment_failed      // Payment failed
charge.refunded                    // Refund processed
payment_intent.canceled            // Payment canceled
```

#### 3. Server Configuration
**File**: `/server/server.js` (modified)

**Changes**:
- Imported payment controller
- Registered payment routes
- Registered webhook routes (before JSON parser)

---

## 🔌 API Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/payments/create-intent` | Create payment intent | JWT |
| POST | `/api/payments/confirm` | Confirm payment | JWT |
| GET | `/api/payments/:paymentId` | Get payment details | JWT |
| GET | `/api/payments` | Get payment history | JWT |
| POST | `/api/payments/:paymentId/refund` | Refund payment | JWT |
| POST | `/api/webhooks/stripe` | Stripe webhooks | Signature |

---

## 🚀 Usage Examples

### Create Payment Intent

```bash
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123",
    "amount": 12000
  }'
```

**Response**:
```json
{
  "clientSecret": "pi_1234_secret_5678",
  "paymentIntentId": "pi_1234567890"
}
```

### Confirm Payment

```bash
curl -X POST http://localhost:5000/api/payments/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_1234567890",
    "bookingId": "booking_123"
  }'
```

**Response**:
```json
{
  "success": true,
  "paymentId": "payment_xyz",
  "message": "Payment confirmed successfully"
}
```

### Get Payment Details

```bash
curl -X GET http://localhost:5000/api/payments/payment_xyz \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Payment History

```bash
curl -X GET "http://localhost:5000/api/payments?status=completed&limit=10&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Refund Payment

```bash
curl -X POST http://localhost:5000/api/payments/payment_xyz/refund \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested cancellation"
  }'
```

---

## 🔐 Security Features

✅ **Authentication**
- JWT required on all payment endpoints
- User authorization verified
- Payment ownership checked

✅ **Webhook Security**
- Stripe signature verification
- Webhook secret validation
- Raw body parsing (before JSON)

✅ **Data Protection**
- Card data never stored on backend
- No sensitive data in logs
- Encrypted transmission (HTTPS)

✅ **Idempotency**
- Double-payment prevention
- Status tracking
- Graceful duplicate handling

---

## 📧 Email Automation

### Payment Success
Automatically sends:
1. **Payment Receipt** - Transaction details
2. **Booking Confirmation** - Service details
3. **Admin Notification** - Payment received

### Payment Failure
Automatically sends:
1. **Admin Notification** - Error details

### Payment Refund
Automatically sends:
1. **Refund Notification** - Refund details
2. **Admin Notification** - Refund processed

All emails sent asynchronously via email queue (Redis).

---

## 🧪 Testing Webhooks Locally

```bash
# Terminal 1: Listen for webhook events
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Terminal 2: Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

---

## 📝 Logging

All operations logged with prefixes:

```
[Payment] Intent created: pi_123 for booking bk_456
[Payment] Payment record created: py_789
[Email] Payment receipt queued for user@example.com
[Webhook] Received event: payment_intent.succeeded
[Webhook] Payment succeeded: py_789
```

---

## 🐛 Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Missing fields | 400 | "Missing required fields" |
| Booking not found | 404 | "Booking not found" |
| Unauthorized | 403 | "Unauthorized access" |
| Already paid | 400 | "Booking already paid" |
| Payment failed | 400 | "Payment not confirmed" |
| Stripe error | 500 | "Failed to create intent" |

---

## ⚙️ Configuration

### Required Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/apex-cleaning

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
ADMIN_EMAIL=admin@apexfivecleaning.co.uk
```

---

## 📊 Database Models

### Payment Model

```javascript
{
  userId,                // User ID
  bookingId,            // Booking ID
  paymentIntentId,      // Stripe PI ID
  amount,               // Amount (pounds)
  currency,             // GBP
  status,               // completed|failed|refunded
  cardBrand,            // Visa, Mastercard
  cardLast4,            // Last 4 digits
  stripeChargeId,       // Stripe charge ID
  failureCode,          // Error code
  failureMessage,       // Error message
  refundAmount,         // Refund amount
  refundId,             // Stripe refund ID
  webhookReceived,      // Webhook confirmed
  processedAt,          // Processed date
  createdAt,            // Created date
  updatedAt             // Updated date
}
```

### Booking Model Updates

```javascript
{
  paymentStatus: 'pending|paid|failed|refunded',
  paymentId: ObjectId,    // Payment reference
  paidAt: Date,          // Payment date
  status: 'confirmed|cancelled'
}
```

---

## 🔄 Payment Flow

```
Frontend (PaymentForm)
    ↓
1. Call POST /api/payments/create-intent
    ↓
2. Receive clientSecret and paymentIntentId
    ↓
3. User enters card details in Stripe Elements
    ↓
4. Call stripe.confirmCardPayment()
    ↓
5. Stripe processes payment
    ↓
6. Call POST /api/payments/confirm
    ↓
7. Backend confirms with Stripe
    ↓
8. Create Payment record
    ↓
9. Update Booking status
    ↓
10. Queue confirmation emails
    ↓
11. Return success response
    ↓
12. Display success page

Webhook (Asynchronous)
    ↓
1. Stripe sends payment_intent.succeeded event
    ↓
2. Webhook verifies signature
    ↓
3. Find/create Payment record (redundancy)
    ↓
4. Send confirmation emails
    ↓
5. Send admin notification
```

---

## 📈 Webhook Event Flow

### Payment Succeeded

```
Stripe Event: payment_intent.succeeded
    ↓
Webhook Handler: handlePaymentSucceeded()
    ↓
1. Find Payment record
2. Extract card details from charge
3. Update status to "completed"
4. Update Booking to "confirmed"
5. Queue emails:
   - Payment receipt
   - Booking confirmation
   - Admin notification
```

### Payment Failed

```
Stripe Event: payment_intent.payment_failed
    ↓
Webhook Handler: handlePaymentFailed()
    ↓
1. Find Payment record
2. Store error code and message
3. Update status to "failed"
4. Update Booking payment status
5. Send admin notification
```

### Charge Refunded

```
Stripe Event: charge.refunded
    ↓
Webhook Handler: handleChargeRefunded()
    ↓
1. Find Payment by charge ID
2. Update refund amount
3. Update status to "refunded"
4. Update Booking to "cancelled"
5. Queue emails:
   - Refund notification
   - Admin notification
```

---

## 🎯 Success Criteria

✅ **Functionality**
- [x] Payment intent creation
- [x] Payment confirmation
- [x] Payment history retrieval
- [x] Refund processing
- [x] Webhook event handling

✅ **Security**
- [x] JWT authentication
- [x] User authorization
- [x] Webhook signature verification
- [x] Idempotency protection

✅ **Reliability**
- [x] Async email queuing
- [x] Error handling
- [x] Logging
- [x] Duplicate prevention

✅ **Integration**
- [x] Payment Controller
- [x] Webhook Routes
- [x] Server Configuration
- [x] Email Automation

---

## 🔗 Related Documentation

- **PHASE_7_IMPLEMENTATION.md** - Complete technical details
- **PHASE_6_IMPLEMENTATION.md** - Frontend payment form
- **PHASE_6_INTEGRATION.md** - Full integration guide
- **README.md** - Project overview

---

## 📞 Troubleshooting

### Webhook not triggering

**Solution**: Check webhook secret in environment
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Payment confirmation failing

**Solution**: Verify JWT token is valid
```javascript
// Token must be in Authorization header
Authorization: Bearer YOUR_JWT_TOKEN
```

### Emails not sending

**Solution**: Check email provider configuration
```javascript
// Verify in logs: healthCheckEmailService()
[Email] Service health: { provider: 'sendgrid', sendGrid: 'configured' }
```

### Duplicate payment records

**Solution**: Idempotency protection automatically handles this
```javascript
// System checks for existing payment intent
if (payment) return; // Already processed
```

---

## 🚀 Deployment Checklist

- [ ] Stripe keys configured (test → production)
- [ ] Webhook secret set
- [ ] Webhook URL registered in Stripe dashboard
- [ ] Email provider configured
- [ ] MongoDB connection verified
- [ ] CORS configured for production
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Logging configured
- [ ] Error monitoring set up
- [ ] Database backups enabled

---

**Phase 7 Complete** ✅

**Ready for**: Phase 8 - Admin Dashboard & Analytics

**Last Updated**: January 28, 2026
