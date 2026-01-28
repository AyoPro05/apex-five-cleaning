# Phase 7: Backend Payment Controller & Webhook Integration

## Status: ✅ COMPLETE

**Date**: January 28, 2026  
**Phase**: 7 (Backend Payment Processing)

---

## Overview

Phase 7 implements the complete backend infrastructure for payment processing and webhook handling. This includes:

- **Payment Controller** - Business logic for payment operations
- **Payment Routes** - API endpoints for frontend integration
- **Webhook Integration** - Stripe event handlers for secure, asynchronous updates
- **Email Automation** - Automatic notifications on payment events
- **Server Configuration** - Route registration and middleware setup

---

## Files Created/Modified

### New Files

1. **paymentController.js** (600+ lines)
   - Location: `/server/src/controllers/paymentController.js`
   - Functions: 5 core payment operations

2. **webhooks.js** (550+ lines)
   - Location: `/server/src/routes/webhooks.js`
   - Events: 4 Stripe webhook handlers

### Modified Files

1. **server.js**
   - Added payment routes registration
   - Added webhook routes (before JSON parser)
   - CORS configuration for webhooks

2. **payments.js** (existing)
   - Already partially implemented
   - Ready for use with new controller

---

## Payment Controller

**Location**: `/server/src/controllers/paymentController.js`

### Function: createPaymentIntent()
```javascript
POST /api/payments/create-intent
Body: { bookingId, amount }
Response: { clientSecret, paymentIntentId }
```

**Security**:
- ✅ JWT authentication required
- ✅ Booking ownership verification
- ✅ Amount validation
- ✅ Double-payment check

**Process**:
1. Validate booking exists and belongs to user
2. Check booking not already paid
3. Validate amount matches booking
4. Create Stripe PaymentIntent
5. Return client secret and payment ID

---

### Function: confirmPayment()
```javascript
POST /api/payments/confirm
Body: { paymentIntentId, bookingId }
Response: { success, paymentId, message }
```

**Security**:
- ✅ JWT authentication required
- ✅ User authorization check
- ✅ Idempotency (prevents double processing)
- ✅ Amount verification

**Process**:
1. Verify booking belongs to user
2. Retrieve payment intent from Stripe
3. Verify payment succeeded
4. Create Payment record (if not exists)
5. Update Booking status to "confirmed"
6. Queue confirmation emails asynchronously
7. Send admin notification

**Email Automation**:
- Payment receipt email (async)
- Booking confirmation email (async)
- Admin notification (async)

---

### Function: getPaymentDetails()
```javascript
GET /api/payments/:paymentId
Response: { id, amount, currency, status, cardBrand, cardLast4, processedAt, booking }
```

**Security**:
- ✅ JWT authentication required
- ✅ User authorization check (own payments only)

---

### Function: getPaymentHistory()
```javascript
GET /api/payments
Query: { status?, limit?, skip? }
Response: { payments, total, limit, skip }
```

**Features**:
- ✅ Pagination support
- ✅ Status filtering
- ✅ Sorted by date (newest first)

---

### Function: refundPayment()
```javascript
POST /api/payments/:paymentId/refund
Body: { reason? }
Response: { success, refundId, amount }
```

**Security**:
- ✅ JWT authentication required
- ✅ User authorization check
- ✅ Booking ownership verification

**Process**:
1. Verify payment exists and belongs to user
2. Check payment hasn't been refunded
3. Create refund with Stripe
4. Update Payment status to "refunded"
5. Update Booking status to "cancelled"
6. Send refund notification email
7. Queue admin notification

---

## Webhook Integration

**Location**: `/server/src/routes/webhooks.js`

### Security

**Signature Verification** ✅
```javascript
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

- ✅ Stripe signature verification (CRITICAL)
- ✅ Webhook secret required
- ✅ Raw body parsing (before JSON)
- ✅ Error handling for invalid signatures

**Idempotency** ✅
- ✅ Duplicate prevention (checks if already processed)
- ✅ Status tracking (webhookReceived, webhookReceivedAt)
- ✅ Graceful handling of re-delivery

### Webhook Endpoints

#### POST /api/webhooks/stripe
- Event: `payment_intent.succeeded`
- Event: `payment_intent.payment_failed`
- Event: `charge.refunded`
- Event: `payment_intent.canceled`

---

## Event Handlers

### 1. payment_intent.succeeded

**Triggered when**: Card payment completes successfully

**Process**:
1. Find or create Payment record
2. Extract card details from Stripe charge
3. Update payment status to "completed"
4. Update booking status to "confirmed"
5. Send confirmation emails (async)
6. Send admin notification

**Emails Queued**:
- Payment receipt
- Booking confirmation
- Admin notification

---

### 2. payment_intent.payment_failed

**Triggered when**: Card payment is declined or fails

**Process**:
1. Find Payment record
2. Update status to "failed"
3. Store error code and message
4. Update booking payment status to "failed"
5. Send admin notification

**Admin Notification**:
- Error code and message
- Customer contact info
- Payment amount
- Booking details

---

### 3. charge.refunded

**Triggered when**: Refund is processed

**Process**:
1. Find Payment by charge ID
2. Update refund amount and status
3. Update booking status to "cancelled"
4. Send refund notification email
5. Send admin notification

**Emails Queued**:
- Refund notification to customer
- Admin notification

---

### 4. payment_intent.canceled

**Triggered when**: Payment intent is canceled

**Process**:
1. Find Payment record
2. Update status to "cancelled"
3. Mark webhook as received

---

## API Endpoints

### Payment Operations

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/payments/create-intent` | ✅ JWT | Create payment intent |
| POST | `/api/payments/confirm` | ✅ JWT | Confirm payment |
| GET | `/api/payments/:paymentId` | ✅ JWT | Get payment details |
| GET | `/api/payments` | ✅ JWT | Get payment history |
| POST | `/api/payments/:paymentId/refund` | ✅ JWT | Process refund |

### Webhook Operations

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/webhooks/stripe` | ✅ Sig | Stripe events |

---

## Database Operations

### Payment Model Updates

**Fields Updated**:
```javascript
{
  userId,                    // User ID
  bookingId,                // Booking ID
  paymentIntentId,          // Stripe payment intent ID
  amount,                   // Amount in pounds
  currency,                 // Currency (GBP)
  status,                   // completed|failed|refunded|cancelled
  cardBrand,                // Visa, Mastercard, etc.
  cardLast4,                // Last 4 digits
  stripeChargeId,          // Stripe charge ID
  failureCode,             // Error code (if failed)
  failureMessage,          // Error message (if failed)
  refundAmount,            // Refund amount
  refundId,                // Stripe refund ID
  refundReason,            // Refund reason
  refundProcessedAt,       // Refund date
  webhookReceived,         // Webhook confirmation
  webhookReceivedAt,       // Webhook receipt time
  processedAt,             // Payment processed date
  createdAt,               // Created date
  updatedAt                // Updated date
}
```

### Booking Model Updates

**Status Transitions**:
```
pending_payment
    ↓
confirmed (on payment success)
    ↓
completed (on service completion)

OR

pending_payment
    ↓
cancelled (on refund)
    ↓
refunded
```

**Fields Updated**:
```javascript
{
  paymentStatus,    // pending|paid|failed|refunded
  paymentId,       // Payment record reference
  paidAt,          // Payment date
  status           // confirmed|cancelled
}
```

---

## Error Handling

### Payment Errors (createPaymentIntent)

| Error | Status | Response |
|-------|--------|----------|
| Missing fields | 400 | "Missing required fields" |
| Invalid amount | 400 | "Invalid amount" |
| Booking not found | 404 | "Booking not found" |
| Unauthorized | 403 | "Unauthorized access" |
| Already paid | 400 | "Booking already paid" |
| Amount mismatch | 400 | "Amount mismatch" |
| Stripe error | 500 | "Failed to create intent" |

### Confirmation Errors (confirmPayment)

| Error | Status | Response |
|-------|--------|----------|
| Missing fields | 400 | "Missing required fields" |
| Booking not found | 403 | "Unauthorized access" |
| Intent not found | 404 | "Payment intent not found" |
| Payment not confirmed | 400 | "Payment not confirmed" |
| No charge found | 400 | "No charge found" |

### Refund Errors (refundPayment)

| Error | Status | Response |
|-------|--------|----------|
| Payment not found | 404 | "Payment not found" |
| Unauthorized | 403 | "Unauthorized access" |
| Already refunded | 400 | "Payment already refunded" |
| Stripe error | 400 | "Refund not allowed" |

---

## Logging

All operations are logged with `[Component]` prefix:

```javascript
[Payment] Intent created: pi_123 for booking bk_456
[Payment] Payment record created: py_789
[Payment] Booking updated: bk_456 -> confirmed, paid
[Email] Payment receipt queued for user@example.com
[Email] Booking confirmation queued for user@example.com
[Webhook] Received event: payment_intent.succeeded
[Webhook] Payment succeeded: py_789
```

---

## Email Integration

### Automated Emails

**On Payment Success**:
1. Payment Receipt (to customer)
2. Booking Confirmation (to customer)
3. Admin Notification (to admin)

**On Payment Failure**:
1. Admin Notification only

**On Refund**:
1. Refund Notification (to customer)
2. Admin Notification (to admin)

### Email Service

Uses `emailServiceEnhanced.js`:
- ✅ Async queue (Redis)
- ✅ Retry logic (exponential backoff)
- ✅ Multiple providers (SendGrid/SMTP)
- ✅ HTML templates
- ✅ Error handling

---

## Security Checklist

✅ **Authentication**
- JWT required on all payment endpoints
- User authorization verified
- Payment ownership checked

✅ **Data Validation**
- Amount validated (positive, within limits)
- Booking verified (exists, belongs to user)
- Card details never stored in backend

✅ **PCI Compliance**
- Card data handled by Stripe only
- Client secret for secure processing
- No sensitive data in logs
- Webhook signature verified

✅ **Idempotency**
- Double-payment prevention
- Status tracking
- Graceful duplicate handling

✅ **Error Handling**
- User-friendly error messages
- Detailed logging for debugging
- Secure error responses

---

## Configuration

### Required Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (see emailServiceEnhanced.js)
EMAIL_PROVIDER=sendgrid|smtp
SENDGRID_API_KEY=SG.xxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=password

# Server
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/apex-cleaning
CLIENT_URL=http://localhost:5173

# Optional
ADMIN_EMAIL=admin@apexfivecleaning.co.uk
LOG_EMAILS=false
```

---

## Testing

### Manual Testing

**Create Payment Intent**:
```bash
curl -X POST http://localhost:5000/api/payments/create-intent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking_123",
    "amount": 12000
  }'
```

**Confirm Payment**:
```bash
curl -X POST http://localhost:5000/api/payments/confirm \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxxxx",
    "bookingId": "booking_123"
  }'
```

**Get Payment Details**:
```bash
curl -X GET http://localhost:5000/api/payments/payment_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Refund Payment**:
```bash
curl -X POST http://localhost:5000/api/payments/payment_123/refund \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested cancellation"
  }'
```

### Stripe Webhook Testing

```bash
# Listen for webhook events locally
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

---

## Deployment Checklist

- [ ] Stripe Secret Key configured (production)
- [ ] Stripe Webhook Secret configured
- [ ] Webhook endpoint registered in Stripe Dashboard
- [ ] Email provider configured (SendGrid or SMTP)
- [ ] MongoDB connection verified
- [ ] CORS configured for production domain
- [ ] Environment variables set (.env)
- [ ] HTTPS enabled (required for production)
- [ ] Logging configured
- [ ] Error monitoring set up
- [ ] Email queue monitoring set up
- [ ] Database backups configured

---

## Success Metrics

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Payment Success Rate | >95% | Error handling, retries |
| Email Delivery | >98% | Queue system, retries |
| Webhook Processing | 100% | Signature verification, idempotency |
| Response Time | <500ms | Async processing, queuing |
| Error Recovery | >90% | Comprehensive error handling |

---

## Known Limitations

1. **Refunds**: Only available for payments less than 90 days old (Stripe API)
2. **Amount Changes**: If booking price changes after payment intent creation, must create new intent
3. **Multiple Currencies**: Currently GBP only (extensible)
4. **Subscription**: Recurring payments not yet supported

---

## Next Steps

### Phase 8 (Future)
1. Admin payment dashboard
2. Payment analytics and reporting
3. Subscription/recurring payments
4. Invoice generation
5. Payment method management
6. Tax calculation and reporting
7. Multi-currency support
8. Advanced analytics

---

## Summary

Phase 7 is complete with:

✅ **5 Payment Controller Functions**
- Create payment intent
- Confirm payment
- Get payment details
- Get payment history
- Refund payment

✅ **4 Webhook Event Handlers**
- Payment succeeded
- Payment failed
- Charge refunded
- Payment canceled

✅ **Complete Integration**
- Email automation
- Database updates
- Error handling
- Logging
- Security

✅ **Production Ready**
- Idempotency
- Signature verification
- Authorization checks
- Comprehensive logging

---

**Phase 7 Status**: ✅ **COMPLETE**

**Next**: Phase 8 - Admin Dashboard & Analytics

---

*For integration details, see PHASE_6_INTEGRATION.md*

*For security guidelines, see PHASE_6_IMPLEMENTATION.md*
