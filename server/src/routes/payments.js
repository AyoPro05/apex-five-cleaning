/**
 * PAYMENT ROUTES - STRIPE INTEGRATION
 * Handles all payment processing with Stripe
 * 
 * SECURITY NOTES:
 * - Never handle raw card data in backend (PCI compliance)
 * - All sensitive operations go through Stripe
 * - PaymentIntents API ensures idempotency
 * - Webhook signature verification prevents tampering
 * - No card data stored in database (only last 4 digits)
 */

import express from 'express';
import Stripe from 'stripe';
import { authMiddleware } from '../../middleware/auth.js';
import Payment from '../../models/Payment.js';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import Quote from '../models/Quote.js';
import QuotePayment from '../../models/QuotePayment.js';

const router = express.Router();

// Initialize Stripe - required in production, optional fallback only in development
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (process.env.NODE_ENV === "production" && !stripeKey) {
  throw new Error("STRIPE_SECRET_KEY is required in production. Set it in your environment.");
}
let stripe;
try {
  stripe = stripeKey ? new Stripe(stripeKey) : null;
} catch (error) {
  console.warn("Stripe initialization warning:", error.message);
  stripe = null;
}
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate payment amount (in pence, minimum £0.50)
 */
const validatePaymentAmount = (amount) => {
  const minAmount = 50; // £0.50 in pence
  const maxAmount = 99999900; // £999,999.00
  return amount >= minAmount && amount <= maxAmount;
};

/**
 * Format amount for display (pence to pounds)
 */
const formatAmount = (pence) => {
  return (pence / 100).toFixed(2);
};

/**
 * Resolve quote reference (AP12345678 or ObjectId) to a Mongoose query.
 * Returns a Query when the format is valid, otherwise null.
 */
const findQuoteByRef = (quoteRef) => {
  const trimmed = String(quoteRef).trim().toUpperCase();

  // New human-friendly reference (AP + 8 digits)
  if (/^AP\d{8}$/.test(trimmed)) {
    return Quote.findOne({ reference: trimmed });
  }

  // Legacy Mongo ObjectId support
  if (/^[a-f0-9]{24}$/i.test(trimmed)) {
    return Quote.findById(trimmed);
  }

  // Invalid format
  return null;
};

// ============================================
// ROUTES
// ============================================

/**
 * GUEST: Lookup quote for payment
 * GET /api/payments/guest/lookup?quoteId=xxx&email=xxx
 * quoteId can be AP12345678 (reference) or MongoDB ObjectId
 */
router.get('/guest/lookup', async (req, res) => {
  try {
    const { quoteId, email } = req.query;
    if (!quoteId || !email) {
      return res.status(400).json({ success: false, message: 'Quote reference and email are required' });
    }

    const quoteQuery = findQuoteByRef(quoteId);
    if (!quoteQuery) {
      return res
        .status(404)
        .json({ success: false, message: "Quote not found. Check your reference." });
    }

    const quote = await quoteQuery.lean();
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    if (quote.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Email does not match this quote' });
    }
    if (quote.status !== 'converted') {
      return res.status(400).json({ success: false, message: 'This quote is not yet approved for payment' });
    }
    if (!quote.approvedAmount || quote.approvedAmount < 0.5) {
      return res.status(400).json({ success: false, message: 'No payment amount set. Please contact us.' });
    }

    // Check if already paid
    const existingPayment = await QuotePayment.findOne({ quoteId: quote._id, status: 'succeeded' });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'This quote has already been paid' });
    }

    const amountInPence = Math.round(quote.approvedAmount * 100);
    res.json({
      success: true,
      quote: {
        id: quote._id,
        reference: quote.reference,
        customerName: `${quote.firstName} ${quote.lastName}`,
        serviceType: quote.serviceType,
        amount: quote.approvedAmount,
        amountDisplay: `£${(quote.approvedAmount).toFixed(2)}`,
        amountInPence,
      },
    });
  } catch (error) {
    console.error('Guest lookup error:', error);
    res.status(500).json({ success: false, message: 'Failed to lookup quote' });
  }
});

/**
 * GUEST: Create payment intent (no auth)
 * POST /api/payments/guest/create-intent
 */
router.post('/guest/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Payment system unavailable' });
    }

    const { quoteId, email } = req.body;
    if (!quoteId || !email) {
      return res.status(400).json({ success: false, message: 'Quote reference and email are required' });
    }

    const quote = await findQuoteByRef(quoteId);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }
    if (quote.email.toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Email does not match this quote' });
    }
    if (quote.status !== 'converted' || !quote.approvedAmount || quote.approvedAmount < 0.5) {
      return res.status(400).json({ success: false, message: 'Quote not ready for payment' });
    }

    const existingPayment = await QuotePayment.findOne({ quoteId: quote._id, status: 'succeeded' });
    if (existingPayment) {
      return res.status(400).json({ success: false, message: 'Already paid' });
    }

    const amountInPence = Math.round(quote.approvedAmount * 100);
    if (!validatePaymentAmount(amountInPence)) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      description: `Quote payment - ${quote.serviceType} - ${quote.firstName} ${quote.lastName}`,
      metadata: {
        quoteId: quote._id.toString(),
        email: quote.email,
      },
      automatic_payment_methods: { enabled: true },
    });

    const quotePayment = new QuotePayment({
      quoteId: quote._id,
      email: quote.email,
      amount: quote.approvedAmount,
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
    });
    await quotePayment.save();

    res.status(201).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: quotePayment._id.toString(),
      amount: quote.approvedAmount,
      amountDisplay: `£${formatAmount(amountInPence)}`,
    });
  } catch (error) {
    console.error('Guest create-intent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment' });
  }
});

/**
 * GUEST: Get payment success details (no auth)
 * GET /api/payments/guest/:paymentId
 */
router.get('/guest/:paymentId', async (req, res) => {
  try {
    const quotePayment = await QuotePayment.findById(req.params.paymentId)
      .populate('quoteId', 'firstName lastName serviceType');
    if (!quotePayment || quotePayment.status !== 'succeeded') {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    const q = quotePayment.quoteId;
    res.json({
      success: true,
      payment: {
        id: quotePayment._id,
        status: 'succeeded',
        amount: Math.round(quotePayment.amount * 100),
        amountDisplay: `£${(quotePayment.amount).toFixed(2)}`,
        cardLast4: quotePayment.cardLast4,
        cardBrand: quotePayment.cardBrand,
        processedAt: quotePayment.processedAt,
        booking: q ? {
          serviceName: (q.serviceType || '').replace(/-/g, ' '),
          serviceArea: '-',
          date: '-',
          totalPrice: quotePayment.amount,
        } : null,
      },
    });
  } catch (error) {
    console.error('Guest payment fetch error:', error);
    res.status(500).json({ success: false });
  }
});

/**
 * GUEST: Confirm payment (no auth)
 * POST /api/payments/guest/confirm
 */
router.post('/guest/confirm', async (req, res) => {
  try {
    const { paymentIntentId, paymentId } = req.body;
    if (!paymentIntentId || !paymentId) {
      return res.status(400).json({ success: false, message: 'Payment details required' });
    }

    const quotePayment = await QuotePayment.findById(paymentId);
    if (!quotePayment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (quotePayment.stripePaymentIntentId !== paymentIntentId) {
      return res.status(403).json({ success: false, message: 'Invalid payment' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      quotePayment.status = 'succeeded';
      quotePayment.processedAt = new Date();
      if (paymentIntent.charges?.data?.[0]) {
        const charge = paymentIntent.charges.data[0];
        const card = charge.payment_method_details?.card;
        if (card) {
          quotePayment.cardLast4 = card.last4;
          quotePayment.cardBrand = card.brand?.toUpperCase();
          quotePayment.stripeChargeId = charge.id;
        }
      }
      await quotePayment.save();

      return res.json({
        success: true,
        payment: {
          id: quotePayment._id,
          status: 'succeeded',
          amount: quotePayment.amount,
          amountDisplay: `£${(quotePayment.amount).toFixed(2)}`,
        },
      });
    }

    if (paymentIntent.status === 'processing') {
      quotePayment.status = 'processing';
      await quotePayment.save();
      return res.json({ success: true, status: 'processing' });
    }

    quotePayment.status = 'failed';
    quotePayment.failureReason = paymentIntent.last_payment_error?.message;
    await quotePayment.save();
    return res.status(400).json({
      success: false,
      message: paymentIntent.last_payment_error?.message || 'Payment failed',
    });
  } catch (error) {
    console.error('Guest confirm error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm payment' });
  }
});

/**
 * CREATE PAYMENT INTENT
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent for booking
 */
router.post('/create-intent', authMiddleware, async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate booking exists and belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    // Check booking hasn't already been paid
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid'
      });
    }

    // Validate amount
    const amountInPence = Math.round(booking.totalPrice * 100);
    if (!validatePaymentAmount(amountInPence)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Get or create Stripe customer
    const user = await User.findById(req.user.id);
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString()
        }
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: 'gbp',
      customer: stripeCustomerId,
      description: `Cleaning booking - ${booking.serviceName}`,
      metadata: {
        bookingId: bookingId,
        userId: req.user.id,
        serviceType: booking.serviceId
      },
      // Enable automatic confirmation with saved card
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Create payment record in database
    const payment = new Payment({
      userId: req.user.id,
      bookingId: bookingId,
      amount: booking.totalPrice,
      currency: 'GBP',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      stripeCustomerId: stripeCustomerId,
      description: `${booking.serviceName} - ${booking.serviceArea}`
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment intent created successfully',
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: booking.totalPrice,
      amountDisplay: `£${formatAmount(amountInPence)}`,
      booking: {
        id: booking._id,
        serviceName: booking.serviceName,
        date: booking.date,
        serviceArea: booking.serviceArea,
        totalPrice: booking.totalPrice
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

/**
 * CONFIRM PAYMENT
 * POST /api/payments/confirm
 * Confirms payment after Stripe processes it
 */
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { paymentIntentId, paymentId } = req.body;

    if (!paymentIntentId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID and payment ID required'
      });
    }

    // Retrieve payment from database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Authorization check
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this payment'
      });
    }

    // Retrieve PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Payment succeeded
      payment.status = 'succeeded';
      payment.processedAt = new Date();
      payment.webhookReceived = true;
      payment.webhookReceivedAt = new Date();

      // Extract card info if available
      if (paymentIntent.charges.data.length > 0) {
        const charge = paymentIntent.charges.data[0];
        payment.stripeChargeId = charge.id;
        if (charge.payment_method_details?.card) {
          const card = charge.payment_method_details.card;
          payment.cardLast4 = card.last4;
          payment.cardBrand = card.brand?.toUpperCase();
          payment.cardExpiry = `${card.exp_month}/${card.exp_year}`;
        }
      }

      await payment.save();

      // Update booking payment status
      const booking = await Booking.findById(payment.bookingId);
      booking.paymentStatus = 'completed';
      booking.paymentId = payment._id;
      booking.status = 'confirmed';
      await booking.save();

      // Referral: award points when referred user completes first booking (5 pts each)
      const previousPayments = await Payment.countDocuments({
        userId: req.user.id,
        status: 'succeeded',
        _id: { $ne: payment._id },
      });
      if (previousPayments === 0) {
        const Referral = (await import('../../models/Referral.js')).default;
        const referredUser = await User.findById(req.user.id).select('referredBy referralPoints');
        if (referredUser?.referredBy) {
          const referral = await Referral.findOne({
            referredUserId: req.user.id,
            status: 'pending',
          });
          if (referral) {
            referral.status = 'completed';
            referral.pointsAwarded = 5;
            referral.bookingId = booking._id;
            referral.completedAt = new Date();
            await referral.save();
            await User.findByIdAndUpdate(referral.referrerId, {
              $inc: { referralPoints: 5 },
            });
            await User.findByIdAndUpdate(req.user.id, {
              $inc: { referralPoints: 5 },
            });
          }
        }
      }

      return res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          amountDisplay: `£${formatAmount(Math.round(payment.amount * 100))}`,
          cardLast4: payment.cardLast4,
          cardBrand: payment.cardBrand,
          processedAt: payment.processedAt
        },
        booking: {
          id: booking._id,
          status: booking.status,
          serviceName: booking.serviceName
        }
      });
    } else if (paymentIntent.status === 'processing') {
      payment.status = 'processing';
      await payment.save();

      return res.status(202).json({
        success: true,
        message: 'Payment is being processed',
        status: 'processing'
      });
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = paymentIntent.last_payment_error?.message;
      payment.failureCode = paymentIntent.last_payment_error?.code;
      await payment.save();

      return res.status(400).json({
        success: false,
        message: 'Payment failed',
        error: paymentIntent.last_payment_error?.message,
        paymentStatus: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
});

/**
 * GET PAYMENT STATUS
 * GET /api/payments/:paymentId
 * Retrieve current payment status
 */
router.get('/:paymentId', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('bookingId', 'serviceName serviceArea date totalPrice status');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Authorization check
    if (payment.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        statusLabel: payment.getStatusLabel(),
        amount: payment.amount,
        amountDisplay: `£${formatAmount(Math.round(payment.amount * 100))}`,
        currency: payment.currency,
        cardLast4: payment.cardLast4,
        cardBrand: payment.cardBrand,
        cardExpiry: payment.cardExpiry,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
        booking: payment.bookingId
      }
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment status',
      error: error.message
    });
  }
});

/**
 * REFUND PAYMENT
 * POST /api/payments/:paymentId/refund
 * Process full or partial refund
 */
router.post('/:paymentId/refund', authMiddleware, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Authorization check (admin or user)
    const user = await User.findById(req.user.id);
    if (payment.userId.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    // Check payment can be refunded
    if (payment.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund payment with status: ${payment.status}`
      });
    }

    // Validate refund amount
    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed payment amount'
      });
    }

    if (refundAmount + payment.refundedAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: `Total refunds (£${formatAmount(Math.round((refundAmount + payment.refundedAmount) * 100))}) cannot exceed payment amount (£${formatAmount(Math.round(payment.amount * 100))})`
      });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: Math.round(refundAmount * 100), // Convert to pence
      reason: 'requested_by_customer',
      metadata: {
        reason: reason || 'Customer requested refund',
        paymentId: payment._id.toString()
      }
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundedAmount += refundAmount;
    payment.refundReason = reason || 'Customer requested refund';
    payment.refundedAt = new Date();
    await payment.save();

    // Update booking status
    const booking = await Booking.findById(payment.bookingId);
    booking.paymentStatus = 'refunded';
    await booking.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refundAmount,
        amountDisplay: `£${formatAmount(Math.round(refundAmount * 100))}`,
        status: refund.status,
        reason: reason || 'Customer requested refund',
        processedAt: new Date()
      },
      payment: {
        id: payment._id,
        status: payment.status,
        refundedAmount: payment.refundedAmount,
        amountDisplay: `£${formatAmount(Math.round(payment.amount * 100))}`
      }
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
});

/**
 * WEBHOOK - STRIPE EVENTS
 * POST /api/payments/webhook
 * Handles Stripe webhook events (signature verified)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    // Verify webhook signature (SECURITY CRITICAL)
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: `Webhook Error: ${err.message}`
      });
    }

    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing error',
      error: error.message
    });
  }
});

/**
 * Webhook handler: Payment Intent succeeded
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (!payment) {
      console.warn(`Payment record not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    payment.status = 'succeeded';
    payment.processedAt = new Date();
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();

    if (paymentIntent.charges.data.length > 0) {
      const charge = paymentIntent.charges.data[0];
      payment.stripeChargeId = charge.id;
      if (charge.payment_method_details?.card) {
        const card = charge.payment_method_details.card;
        payment.cardLast4 = card.last4;
        payment.cardBrand = card.brand?.toUpperCase();
        payment.cardExpiry = `${card.exp_month}/${card.exp_year}`;
      }
    }

    await payment.save();

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    booking.paymentStatus = 'completed';
    booking.status = 'confirmed';
    await booking.save();

    console.log(`✓ Payment succeeded: ${payment._id}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

/**
 * Webhook handler: Payment Intent failed
 */
async function handlePaymentIntentFailed(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (!payment) {
      console.warn(`Payment record not found for PaymentIntent: ${paymentIntent.id}`);
      return;
    }

    payment.status = 'failed';
    payment.failureReason = paymentIntent.last_payment_error?.message;
    payment.failureCode = paymentIntent.last_payment_error?.code;
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();
    await payment.save();

    // Update booking payment status
    const booking = await Booking.findById(payment.bookingId);
    booking.paymentStatus = 'failed';
    await booking.save();

    console.log(`✗ Payment failed: ${payment._id} - ${payment.failureReason}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Webhook handler: Charge refunded
 */
async function handleChargeRefunded(charge) {
  try {
    const payment = await Payment.findOne({
      stripeChargeId: charge.id
    });

    if (!payment) {
      console.warn(`Payment record not found for Charge: ${charge.id}`);
      return;
    }

    // Update refund info
    const totalRefunded = charge.refunds.data.reduce((sum, refund) => sum + refund.amount, 0) / 100;
    payment.refundedAmount = totalRefunded;
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();

    if (totalRefunded >= payment.amount) {
      payment.status = 'refunded';
      payment.refundedAt = new Date();
    }

    await payment.save();
    console.log(`↩️ Charge refunded: ${charge.id} - Amount: £${formatAmount(charge.refunds.data[0].amount)}`);
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}

/**
 * GET PAYMENT HISTORY
 * GET /api/payments
 * Retrieve user's payment history
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, skip = 0, status } = req.query;
    const filter = { userId: req.user.id };

    if (status) {
      filter.status = status;
    }

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('bookingId', 'serviceName serviceArea date totalPrice status');

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      payments: payments.map(p => ({
        id: p._id,
        status: p.status,
        statusLabel: p.getStatusLabel(),
        amount: p.amount,
        amountDisplay: `£${formatAmount(Math.round(p.amount * 100))}`,
        cardLast4: p.cardLast4,
        cardBrand: p.cardBrand,
        createdAt: p.createdAt,
        booking: p.bookingId
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history',
      error: error.message
    });
  }
});

export default router;
