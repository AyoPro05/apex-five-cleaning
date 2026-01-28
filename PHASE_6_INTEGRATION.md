# Phase 6: Integration Guide

## Overview

This guide shows how to integrate the Payment Form, Email System, and Confirmation Pages into your existing booking flow.

## Table of Contents

1. [Frontend Integration](#frontend-integration)
2. [Backend Integration](#backend-integration)
3. [Payment Endpoint Integration](#payment-endpoint-integration)
4. [Email Integration](#email-integration)
5. [End-to-End Flow](#end-to-end-flow)
6. [Testing & Debugging](#testing--debugging)

---

## Frontend Integration

### Step 1: Update Routes

**File**: `/client/src/App.jsx`

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentError from './pages/PaymentError';
import PaymentPending from './pages/PaymentPending';

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        
        {/* Payment pages */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/error" element={<PaymentError />} />
        <Route path="/payment/pending" element={<PaymentPending />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### Step 2: Integrate PaymentForm into Booking Page

**File**: Create `/client/src/pages/BookingCheckout.jsx`

```jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import { formatAmount } from '../utils/paymentUtils';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const BookingCheckout = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error('Failed to fetch booking');
        
        const data = await response.json();
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  if (loading) {
    return <div className="p-8 text-center">Loading booking details...</div>;
  }

  if (!booking) {
    return <div className="p-8 text-center text-red-600">Booking not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Booking Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Service</p>
                <p className="text-lg font-semibold">{booking.serviceName}</p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Date & Time</p>
                <p className="text-lg font-semibold">
                  {new Date(booking.date).toLocaleDateString('en-GB')} at {booking.time}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Location</p>
                <p className="text-lg font-semibold">{booking.serviceArea}</p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Duration</p>
                <p className="text-lg font-semibold">{booking.duration} hours</p>
              </div>
              
              <hr className="my-4" />
              
              <div>
                <p className="text-gray-600 text-sm">Total Amount</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatAmount(booking.totalAmount)}
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t space-y-2 text-sm text-gray-600">
              <p className="flex items-center gap-2">🔒 Secure payment powered by Stripe</p>
              <p className="flex items-center gap-2">✓ PCI Level 1 compliant</p>
              <p className="flex items-center gap-2">📧 Instant confirmation</p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
            
            <Elements stripe={stripePromise}>
              <PaymentForm
                bookingId={bookingId}
                amount={booking.totalAmount}
                onSuccess={(paymentData) => {
                  // Payment successful
                  navigate(
                    `/payment/success?payment_id=${paymentData.id}&booking_id=${bookingId}`
                  );
                }}
                onError={(error) => {
                  // Payment failed
                  navigate(
                    `/payment/error?code=${error.code}&booking_id=${bookingId}`
                  );
                }}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCheckout;
```

### Step 3: Add Payment Link to Quote/Booking Pages

**File**: Update `/client/src/pages/Quote.jsx` or similar

```jsx
// After successful quote creation
const handleQuoteSuccess = (quoteId) => {
  // Create booking from quote
  const bookingId = createBookingFromQuote(quoteId);
  
  // Redirect to checkout
  navigate(`/booking/${bookingId}/checkout`);
};
```

---

## Backend Integration

### Step 1: Create Payment Controller

**File**: `/server/src/controllers/paymentController.js`

```javascript
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import {
  sendPaymentReceipt,
  sendBookingConfirmation,
  sendAdminNotification,
} from '../utils/emailServiceEnhanced.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment intent
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    // Validate booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId !== userId) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Validate amount matches booking
    if (amount !== booking.totalAmount) {
      return res.status(400).json({ error: 'Amount mismatch' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      metadata: {
        bookingId,
        userId,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Confirm payment
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.user.id;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'Payment not confirmed',
        code: paymentIntent.last_payment_error?.code,
      });
    }

    // Find or create payment record
    let payment = await Payment.findOne({ paymentIntentId });
    
    if (!payment) {
      // Get booking details
      const booking = await Booking.findById(bookingId);
      
      // Create payment record
      payment = new Payment({
        userId,
        bookingId,
        paymentIntentId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'completed',
        cardBrand: paymentIntent.charges.data[0]?.payment_method_details?.card?.brand,
        cardLast4: paymentIntent.charges.data[0]?.payment_method_details?.card?.last4,
        processedAt: new Date(),
      });

      await payment.save();

      // Update booking status
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      booking.paymentId = payment._id;
      await booking.save();

      // Send confirmation emails
      await sendPaymentReceipt(payment, booking);
      await sendBookingConfirmation(booking, payment);
      
      // Notify admin
      await sendAdminNotification('New Payment Received', {
        bookingId,
        amount: (paymentIntent.amount / 100).toFixed(2),
        customerEmail: booking.email,
      });
    }

    res.json({
      success: true,
      paymentId: payment._id,
      message: 'Payment confirmed',
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get payment details
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(paymentId).populate('bookingId');
    
    if (!payment || payment.userId !== userId) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      id: payment.paymentIntentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      cardBrand: payment.cardBrand,
      cardLast4: payment.cardLast4,
      processedAt: payment.processedAt,
      booking: {
        id: payment.bookingId._id,
        serviceName: payment.bookingId.serviceName,
        date: payment.bookingId.date,
        time: payment.bookingId.time,
        serviceArea: payment.bookingId.serviceArea,
      },
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
  getPaymentDetails,
};
```

### Step 2: Create Payment Routes

**File**: `/server/src/routes/payments.js`

```javascript
import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createPaymentIntent,
  confirmPayment,
  getPaymentDetails,
} from '../controllers/paymentController.js';

const router = express.Router();

// Middleware
router.use(authMiddleware);

// Routes
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/:paymentId', getPaymentDetails);

export default router;
```

### Step 3: Register Routes in Server

**File**: `/server/server.js`

```javascript
import paymentRoutes from './src/routes/payments.js';

// ... existing setup code ...

// Register payment routes
app.use('/api/payments', paymentRoutes);
```

---

## Payment Endpoint Integration

### Stripe Webhook Integration

**File**: `/server/src/routes/webhooks.js`

```javascript
import express from 'express';
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import { sendAdminNotification } from '../utils/emailServiceEnhanced.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook error: ${error.message}`);
  }
});

async function handlePaymentSucceeded(paymentIntent) {
  const payment = await Payment.findOne({
    paymentIntentId: paymentIntent.id,
  });

  if (payment) {
    payment.status = 'completed';
    await payment.save();
    
    await sendAdminNotification('Payment Succeeded (Webhook)', {
      paymentId: payment.paymentIntentId,
      amount: (paymentIntent.amount / 100).toFixed(2),
    });
  }
}

async function handlePaymentFailed(paymentIntent) {
  await sendAdminNotification('Payment Failed (Webhook)', {
    paymentId: paymentIntent.id,
    reason: paymentIntent.last_payment_error?.message,
  });
}

async function handleChargeRefunded(charge) {
  const payment = await Payment.findOne({
    paymentIntentId: charge.payment_intent,
  });

  if (payment) {
    payment.status = 'refunded';
    payment.refundAmount = charge.amount_refunded;
    payment.refundProcessedAt = new Date();
    await payment.save();
  }
}

export default router;
```

---

## Email Integration

### Send Email on Payment Success

**File**: In `paymentController.js` - Update `confirmPayment`

```javascript
// After payment record created
const payment = new Payment({...});
await payment.save();

// Update booking
booking.status = 'confirmed';
await booking.save();

// Send emails
try {
  // Payment receipt (async queue)
  await sendPaymentReceipt(payment, booking, true);
  
  // Booking confirmation (async queue)
  await sendBookingConfirmation(booking, payment, true);
  
  // Admin notification (async queue)
  await sendAdminNotification(
    'New Payment Received',
    { bookingId, amount: (paymentIntent.amount / 100).toFixed(2) },
    null,
    true
  );
} catch (error) {
  console.error('Email error:', error);
  // Don't fail payment if email fails
  // Emails will retry from queue
}
```

### Send Email on Payment Failure

```javascript
// In payment error handling
import { sendAdminNotification } from '../utils/emailServiceEnhanced.js';

// Notify admin of failed payment
await sendAdminNotification(
  'Payment Failed',
  {
    bookingId,
    error: paymentIntent.last_payment_error?.message,
    code: paymentIntent.last_payment_error?.code,
  },
  null,
  true
);
```

### Send Refund Email

```javascript
import { sendRefundNotification } from '../utils/emailServiceEnhanced.js';

// On refund creation
const refund = await stripe.refunds.create({
  payment_intent: paymentIntent.id,
  reason: 'requested_by_customer',
});

// Update payment record
payment.status = 'refunded';
payment.refundAmount = refund.amount;
payment.refundProcessedAt = new Date();
await payment.save();

// Send refund notification
await sendRefundNotification(
  payment,
  booking,
  'Customer requested cancellation',
  true
);
```

---

## End-to-End Flow

### Complete User Journey

```
1. User creates booking
   ↓
2. Booking saved with status: "pending_payment"
   ↓
3. User redirected to /booking/{id}/checkout
   ↓
4. BookingCheckout page loads
   ↓
5. User submits PaymentForm
   ↓
6. Frontend calls POST /api/payments/create-intent
   ↓
7. Backend creates Stripe PaymentIntent
   ↓
8. Frontend shows CardElement (Stripe.js)
   ↓
9. User enters card details
   ↓
10. Frontend calls stripe.confirmCardPayment()
    ↓
11. User completes 3D Secure (if required)
    ↓
12. Frontend calls POST /api/payments/confirm
    ↓
13. Backend confirms payment with Stripe
    ↓
14. Backend creates Payment record
    ↓
15. Backend updates Booking status to "confirmed"
    ↓
16. Backend sends emails:
    - sendPaymentReceipt() → Queue
    - sendBookingConfirmation() → Queue
    - sendAdminNotification() → Queue
    ↓
17. Frontend navigated to /payment/success
    ↓
18. User sees confirmation with booking details
    ↓
19. User receives confirmation emails within seconds
    ↓
20. Admin receives notification email
```

### Error Recovery Flow

```
1. User submits PaymentForm with declined card
   ↓
2. stripe.confirmCardPayment() returns error
   ↓
3. PaymentForm displays error message
   ↓
4. Frontend navigates to /payment/error?code=card_declined
   ↓
5. Error page shows solutions
   ↓
6. User clicks "Try Again" button
   ↓
7. User enters different card
   ↓
8. (repeat from step 1)
   ↓
9. Eventually succeeds → Success page
```

---

## Testing & Debugging

### Test Stripe Cards

**Success Cards**:
- `4242 4242 4242 4242` - Success
- `4000 0025 0000 3155` - 3D Secure required

**Declined Cards**:
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 9987` - Lost card

**Expiry & CVV**: Any future date & any 3-digit CVV

### Debug Payment Form

```javascript
// In PaymentForm.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('DEBUG: Form submission started');
  console.log('DEBUG: Stripe available:', stripe);
  console.log('DEBUG: Elements available:', elements);
  console.log('DEBUG: Card complete:', cardElement._complete);
  
  // Rest of form submission...
};
```

### Debug Email Sending

```javascript
// In .env
LOG_EMAILS=true

// Check email queue stats
import { getEmailQueueStats } from './utils/emailServiceEnhanced.js';

const stats = await getEmailQueueStats();
console.log('Email Queue:', stats);
// Output: { available: true, active: 0, completed: 120, failed: 2 }
```

### Debug Payment Confirmation

```javascript
// Test payment confirmation manually
curl -X POST http://localhost:5000/api/payments/confirm \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxxxx",
    "bookingId": "booking_xxxxx"
  }'
```

### Monitor Webhook Events

```bash
# Install Stripe CLI
npm install -g @stripe/stripe-cli

# Listen for webhook events
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

---

## Common Issues & Solutions

### Issue: PaymentForm not rendering

**Solution**: Check Stripe public key
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxx  # Must start with pk_
```

### Issue: "Payment Intent client secret mismatch"

**Solution**: Ensure same bookingId used throughout
```javascript
// Create intent with bookingId
const intent = await createPaymentIntent(bookingId);

// Confirm payment with same bookingId
const confirmed = await confirmPayment(paymentIntentId, bookingId);
```

### Issue: Email not sending

**Solution**: Check email provider health
```javascript
const health = await healthCheckEmailService();
console.log(health);
```

### Issue: "Idempotency Key" error

**Solution**: Unique key generated per payment
```javascript
// In paymentUtils.js
const key = generateIdempotencyKey();  // UUID + timestamp
```

---

**Integration Guide Complete!**

All components are now connected and ready for testing.

See [PHASE_6_IMPLEMENTATION.md](./PHASE_6_IMPLEMENTATION.md) for detailed component documentation.
