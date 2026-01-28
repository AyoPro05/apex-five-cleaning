# Phase 6: Quick Reference Guide

## 📚 Documentation Files

| File | Purpose | Lines |
|------|---------|-------|
| [PHASE_6_COMPLETION.md](./PHASE_6_COMPLETION.md) | Executive summary, metrics, achievements | 700+ |
| [PHASE_6_IMPLEMENTATION.md](./PHASE_6_IMPLEMENTATION.md) | Technical details, architecture, testing | 350+ |
| [PHASE_6_INTEGRATION.md](./PHASE_6_INTEGRATION.md) | Integration steps, backend setup, flows | 400+ |

## 🎯 Core Components

### Frontend (5 files)

#### 1. PaymentForm.jsx
**Path**: `/client/src/components/PaymentForm.jsx`
- Stripe Elements integration
- Card validation & error handling
- Loading states & accessibility

```jsx
import PaymentForm from './components/PaymentForm';

<PaymentForm 
  bookingId="booking-123"
  amount={12000}
  onSuccess={handleSuccess}
  onError={handleError}
/>
```

#### 2. paymentUtils.js
**Path**: `/client/src/utils/paymentUtils.js`
- 12+ helper functions
- Formatting, validation, retry logic

```javascript
import { 
  formatAmount, 
  generateIdempotencyKey 
} from '../utils/paymentUtils';

const display = formatAmount(12000); // "£120.00"
const key = generateIdempotencyKey();
```

#### 3. PaymentSuccess.jsx
**Path**: `/client/src/pages/PaymentSuccess.jsx`
- Confirmation page with details
- Print receipt functionality

#### 4. PaymentError.jsx
**Path**: `/client/src/pages/PaymentError.jsx`
- Error details with solutions
- FAQ accordion

#### 5. PaymentPending.jsx
**Path**: `/client/src/pages/PaymentPending.jsx`
- Processing status timeline
- Countdown timer

### Backend (2 files)

#### 6. emailTemplates.js
**Path**: `/server/src/templates/emailTemplates.js`
- 3 professional HTML templates
- Payment receipts, confirmations, refunds

```javascript
import { 
  paymentReceiptTemplate,
  bookingConfirmationTemplate,
  refundNotificationTemplate 
} from './templates/emailTemplates';
```

#### 7. emailServiceEnhanced.js
**Path**: `/server/src/utils/emailServiceEnhanced.js`
- Full email system with queue
- Multiple providers (SendGrid/SMTP)
- Retry logic with exponential backoff

```javascript
import { 
  sendPaymentReceipt,
  sendBookingConfirmation,
  sendRefundNotification
} from './utils/emailServiceEnhanced';

// Send with async queue
await sendPaymentReceipt(payment, booking, true);
```

## 🔑 Key Functions

### Payment Utilities

```javascript
// Formatting
formatAmount(12000)                    // "£120.00"
parseAmount("120.00")                  // 12000

// Validation
isCardComplete(cardElement)            // boolean
validateBookingForPayment(booking)     // boolean
validatePaymentResponse(response)      // boolean

// Error Handling
getPaymentErrorMessage(error)          // "user-friendly message"
isRetryableError(error)                // boolean
handlePaymentRetry(error, fn, max)     // Promise

// Utilities
generateIdempotencyKey()               // "unique-key"
createPaymentMetadata(booking)         // {object}
formatCardDisplay(last4, brand)        // "Visa ending in 4242"
isTestMode()                           // boolean
getPaymentStatusLabel(status)          // "status label"
getPaymentDeadline(booking)            // Date
isPaymentDeadlinePassed(deadline)      // boolean
```

### Email Service

```javascript
// Send emails
sendPaymentReceipt(payment, booking, queue)
sendBookingConfirmation(booking, payment, queue)
sendRefundNotification(payment, booking, reason, queue)
sendAdminNotification(subject, data, email, queue)

// Queue management
queueEmail(mailData)
getEmailQueueStats()
clearFailedEmails()

// Health & monitoring
healthCheckEmailService()
```

## 🔧 Environment Setup

### Frontend (.env.local)
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (.env)
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email (SendGrid)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=no-reply@apexfivecleaning.co.uk

# Or SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=password

# Optional
REDIS_HOST=localhost
REDIS_PORT=6379
ADMIN_EMAIL=admin@apexfivecleaning.co.uk
CLIENT_URL=https://apexfivecleaning.co.uk
LOG_EMAILS=false
```

## 🧪 Test Cards

### Success
- `4242 4242 4242 4242` - Standard success
- `4000 0025 0000 3155` - 3D Secure required

### Declines
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 9987` - Lost card

**Expiry**: Any future date  
**CVV**: Any 3-digit number

## 🔐 Security Checklist

- [ ] STRIPE_SECRET_KEY set (backend only)
- [ ] VITE_STRIPE_PUBLIC_KEY set (public key safe)
- [ ] HTTPS enforced on all domains
- [ ] JWT tokens validated on requests
- [ ] Email validation before sending
- [ ] No card data in logs
- [ ] CORS properly configured
- [ ] Webhook secret verified
- [ ] Admin email configured
- [ ] Email provider credentials secure

## ♿ Accessibility Features

- ✅ WCAG 2.1 AA compliant
- ✅ Semantic HTML
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast 4.5:1
- ✅ Focus visible
- ✅ Prefers-reduced-motion respected

## 📊 Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `card_declined` | Card declined | Try different card |
| `expired_card` | Card expired | Use valid card |
| `processing_error` | Temp error | Retry in 2 min |
| `authentication_error` | 3D Secure failed | Verify with bank |
| `insufficient_funds` | No funds | Check balance |
| `generic_decline` | Payment failed | Contact support |

## 🚀 Quick Start Integration

### 1. Add Routes to App.jsx
```jsx
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentError from './pages/PaymentError';
import PaymentPending from './pages/PaymentPending';

<Routes>
  <Route path="/payment/success" element={<PaymentSuccess />} />
  <Route path="/payment/error" element={<PaymentError />} />
  <Route path="/payment/pending" element={<PaymentPending />} />
</Routes>
```

### 2. Use PaymentForm in Checkout
```jsx
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/js';
import PaymentForm from './components/PaymentForm';

const stripe = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

<Elements stripe={stripe}>
  <PaymentForm 
    bookingId={id}
    amount={booking.totalAmount}
    onSuccess={handleSuccess}
    onError={handleError}
  />
</Elements>
```

### 3. Import Email Service
```javascript
import {
  sendPaymentReceipt,
  sendBookingConfirmation
} from './utils/emailServiceEnhanced';

// On payment success
await sendPaymentReceipt(payment, booking, true);
await sendBookingConfirmation(booking, payment, true);
```

## 📈 Monitoring

### Email Queue Status
```javascript
const stats = await getEmailQueueStats();
console.log(stats);
// { available: true, active: 0, completed: 120, failed: 2 }
```

### Service Health
```javascript
const health = await healthCheckEmailService();
console.log(health);
// { provider: 'sendgrid', sendGrid: 'configured', queue: 'available' }
```

### Clear Failed Emails
```javascript
const result = await clearFailedEmails();
console.log(`Cleared ${result.cleared} emails`);
```

## 🔗 Webhook Events

**Configure Stripe webhook for**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Test locally**:
```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

## 📱 URLs & Queries

```
/payment/success?payment_id=pi_123&booking_id=bk_456
/payment/error?code=card_declined&booking_id=bk_456
/payment/pending?payment_id=pi_123&booking_id=bk_456
```

## 🐛 Troubleshooting

### Payment form not loading
- Check `VITE_STRIPE_PUBLIC_KEY` environment variable
- Ensure key starts with `pk_`

### Emails not sending
- Run `healthCheckEmailService()`
- Check email provider credentials
- Verify SMTP/SendGrid configuration

### Queue stuck
- Run `clearFailedEmails()`
- Check Redis connection
- Review email logs

## 📞 Support

**For detailed info, see**:
- [PHASE_6_IMPLEMENTATION.md](./PHASE_6_IMPLEMENTATION.md) - Full technical details
- [PHASE_6_INTEGRATION.md](./PHASE_6_INTEGRATION.md) - Integration steps
- [PHASE_6_COMPLETION.md](./PHASE_6_COMPLETION.md) - Achievement summary

---

**Phase 6 Complete** ✅  
**Commit**: 336cd85  
**Ready for**: Phase 7 - Backend Payment Controller & Webhooks
