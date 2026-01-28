/**
 * PAYMENT CONTROLLER
 * Handles payment intent creation, confirmation, and retrieval
 */

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
 * Create Payment Intent
 * POST /api/payments/create-intent
 *
 * Body:
 * {
 *   bookingId: string,
 *   amount: number (in pence)
 * }
 *
 * Response:
 * {
 *   clientSecret: string,
 *   paymentIntentId: string
 * }
 */
export const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!bookingId || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, amount',
      });
    }

    // Validate amount is positive number
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        error: 'Invalid amount. Must be positive integer (pence)',
      });
    }

    // Fetch booking and verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.warn(`[Payment] Booking not found: ${bookingId}`);
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId.toString() !== userId) {
      console.warn(`[Payment] Unauthorized access to booking: ${bookingId} by user ${userId}`);
      return res.status(403).json({ error: 'Unauthorized access to booking' });
    }

    // Validate booking state
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({
        error: 'Booking already paid',
      });
    }

    // Validate amount matches booking
    if (amount !== booking.totalAmount) {
      console.warn(
        `[Payment] Amount mismatch for booking ${bookingId}: expected ${booking.totalAmount}, got ${amount}`
      );
      return res.status(400).json({
        error: 'Amount mismatch. Please refresh and try again',
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      metadata: {
        bookingId: bookingId,
        userId: userId,
        serviceType: booking.serviceType,
        customerEmail: booking.email,
      },
      description: `Booking for ${booking.serviceType} - ${booking.email}`,
    });

    console.log(`[Payment] Intent created: ${paymentIntent.id} for booking ${bookingId}`);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('[Payment] Error creating payment intent:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid payment request. Please check your details.',
      });
    }

    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        error: 'Payment service authentication failed',
      });
    }

    res.status(500).json({
      error: 'Failed to create payment intent',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Confirm Payment
 * POST /api/payments/confirm
 *
 * Body:
 * {
 *   paymentIntentId: string,
 *   bookingId: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   paymentId: string,
 *   message: string
 * }
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!paymentIntentId || !bookingId) {
      return res.status(400).json({
        error: 'Missing required fields: paymentIntentId, bookingId',
      });
    }

    // Verify booking belongs to user
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.userId.toString() !== userId) {
      console.warn(`[Payment] Unauthorized booking access: ${bookingId}`);
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Retrieve payment intent from Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error(`[Payment] Failed to retrieve intent ${paymentIntentId}:`, error.message);
      return res.status(404).json({
        error: 'Payment intent not found',
      });
    }

    // Verify payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      console.warn(`[Payment] Intent not succeeded: ${paymentIntentId} - Status: ${paymentIntent.status}`);

      const errorCode = paymentIntent.last_payment_error?.code || 'unknown_error';

      return res.status(400).json({
        error: 'Payment not confirmed',
        status: paymentIntent.status,
        code: errorCode,
        message: paymentIntent.last_payment_error?.message,
      });
    }

    // Check if payment already processed (idempotency)
    let payment = await Payment.findOne({ paymentIntentId });

    if (payment) {
      // Payment already processed - return success
      console.log(`[Payment] Payment already processed: ${paymentIntentId}`);
      return res.json({
        success: true,
        paymentId: payment._id,
        message: 'Payment already confirmed',
      });
    }

    // Extract card details from Stripe charge
    const charge = paymentIntent.charges.data[0];
    if (!charge) {
      console.error(`[Payment] No charge found for intent ${paymentIntentId}`);
      return res.status(400).json({
        error: 'No charge found in payment intent',
      });
    }

    // Create payment record
    payment = new Payment({
      userId,
      bookingId,
      paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'completed',
      cardBrand: charge.payment_method_details?.card?.brand || 'Unknown',
      cardLast4: charge.payment_method_details?.card?.last4 || '****',
      cardFingerprint: charge.payment_method_details?.card?.fingerprint,
      stripeChargeId: charge.id,
      processedAt: new Date(charge.created * 1000), // Stripe uses Unix timestamp
    });

    await payment.save();
    console.log(`[Payment] Payment record created: ${payment._id}`);

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentId = payment._id;
    booking.paidAt = new Date();
    await booking.save();
    console.log(`[Payment] Booking updated: ${bookingId} -> confirmed, paid`);

    // Send confirmation emails asynchronously
    // Don't wait for emails - return success to user immediately
    setImmediate(async () => {
      try {
        // Send payment receipt
        await sendPaymentReceipt(
          {
            id: payment.paymentIntentId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            cardBrand: payment.cardBrand,
            cardLast4: payment.cardLast4,
            processedAt: payment.processedAt,
          },
          {
            id: booking._id,
            email: booking.email,
            serviceName: booking.serviceName,
            date: booking.date,
            time: booking.time,
            serviceArea: booking.serviceArea,
          },
          true // Queue for async delivery
        );
        console.log(`[Email] Payment receipt queued for ${booking.email}`);

        // Send booking confirmation
        await sendBookingConfirmation(
          {
            id: booking._id,
            serviceName: booking.serviceName,
            date: booking.date,
            time: booking.time,
            duration: booking.duration,
            serviceArea: booking.serviceArea,
            email: booking.email,
            notes: booking.notes,
          },
          {
            id: payment.paymentIntentId,
            amount: payment.amount,
            cardBrand: payment.cardBrand,
            cardLast4: payment.cardLast4,
          },
          true // Queue for async delivery
        );
        console.log(`[Email] Booking confirmation queued for ${booking.email}`);

        // Send admin notification
        await sendAdminNotification(
          'New Payment Received',
          {
            bookingId: booking._id,
            amount: (payment.amount / 100).toFixed(2),
            currency: payment.currency,
            customerEmail: booking.email,
            customerName: `${booking.firstName} ${booking.lastName}`,
            serviceType: booking.serviceType,
            cardBrand: payment.cardBrand,
            cardLast4: payment.cardLast4,
            timestamp: new Date().toISOString(),
          },
          null,
          true // Queue for async delivery
        );
        console.log('[Email] Admin notification queued');
      } catch (emailError) {
        console.error('[Email] Error sending confirmation emails:', emailError);
        // Don't fail the payment if emails fail - they'll retry from queue
      }
    });

    res.json({
      success: true,
      paymentId: payment._id,
      message: 'Payment confirmed successfully',
    });
  } catch (error) {
    console.error('[Payment] Error confirming payment:', error);

    res.status(500).json({
      error: 'Failed to confirm payment',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get Payment Details
 * GET /api/payments/:paymentId
 *
 * Response:
 * {
 *   id: string,
 *   amount: number,
 *   currency: string,
 *   status: string,
 *   cardBrand: string,
 *   cardLast4: string,
 *   processedAt: date,
 *   booking: {
 *     id: string,
 *     serviceName: string,
 *     date: date,
 *     time: string,
 *     serviceArea: string
 *   }
 * }
 */
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Find payment and verify ownership
    const payment = await Payment.findById(paymentId).populate('bookingId', [
      'serviceName',
      'date',
      'time',
      'serviceArea',
      'userId',
    ]);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify user owns this payment
    if (payment.userId.toString() !== userId) {
      console.warn(`[Payment] Unauthorized access to payment ${paymentId} by user ${userId}`);
      return res.status(403).json({ error: 'Unauthorized access' });
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
    console.error('[Payment] Error fetching payment details:', error);

    res.status(500).json({
      error: 'Failed to fetch payment details',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get Payment History
 * GET /api/payments
 *
 * Query params:
 * - status: completed|refunded|failed
 * - limit: number (default 10)
 * - skip: number (default 0)
 *
 * Response:
 * {
 *   payments: [{...}],
 *   total: number,
 *   limit: number,
 *   skip: number
 * }
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 10, skip = 0 } = req.query;

    // Build query
    const query = { userId };
    if (status) {
      query.status = status;
    }

    // Fetch payments with pagination
    const payments = await Payment.find(query)
      .populate('bookingId', ['serviceName', 'date', 'serviceArea'])
      .sort({ processedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Get total count
    const total = await Payment.countDocuments(query);

    res.json({
      payments: payments.map((p) => ({
        id: p._id,
        paymentIntentId: p.paymentIntentId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        cardBrand: p.cardBrand,
        cardLast4: p.cardLast4,
        processedAt: p.processedAt,
        booking: {
          id: p.bookingId._id,
          serviceName: p.bookingId.serviceName,
          date: p.bookingId.date,
          serviceArea: p.bookingId.serviceArea,
        },
      })),
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    console.error('[Payment] Error fetching payment history:', error);

    res.status(500).json({
      error: 'Failed to fetch payment history',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Refund Payment
 * POST /api/payments/:paymentId/refund
 *
 * Body:
 * {
 *   reason: string (optional)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   refundId: string,
 *   amount: number
 * }
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Find payment
    const payment = await Payment.findById(paymentId).populate('bookingId');
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify ownership
    if (payment.userId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Check if already refunded
    if (payment.status === 'refunded') {
      return res.status(400).json({
        error: 'Payment already refunded',
      });
    }

    // Create refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.paymentIntentId,
      reason: reason || 'requested_by_customer',
    });

    console.log(`[Payment] Refund created: ${refund.id} for payment ${paymentId}`);

    // Update payment record
    payment.status = 'refunded';
    payment.refundAmount = refund.amount;
    payment.refundId = refund.id;
    payment.refundReason = reason;
    payment.refundProcessedAt = new Date();
    await payment.save();

    // Update booking status
    const booking = payment.bookingId;
    booking.status = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    console.log(`[Payment] Booking ${booking._id} marked as cancelled`);

    // Send refund notification email asynchronously
    setImmediate(async () => {
      try {
        const { sendRefundNotification } = await import('../utils/emailServiceEnhanced.js');
        await sendRefundNotification(
          {
            id: payment.paymentIntentId,
            refundAmount: payment.refundAmount,
            refundProcessedAt: payment.refundProcessedAt,
            cardBrand: payment.cardBrand,
            cardLast4: payment.cardLast4,
          },
          {
            email: booking.email,
            serviceName: booking.serviceName,
            date: booking.date,
            serviceArea: booking.serviceArea,
          },
          reason || 'Booking cancelled',
          true
        );
        console.log(`[Email] Refund notification queued for ${booking.email}`);
      } catch (emailError) {
        console.error('[Email] Error sending refund email:', emailError);
      }
    });

    res.json({
      success: true,
      refundId: refund.id,
      amount: refund.amount,
    });
  } catch (error) {
    console.error('[Payment] Error processing refund:', error);

    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Refund not allowed. Charge may be too old.',
      });
    }

    res.status(500).json({
      error: 'Failed to process refund',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
  getPaymentDetails,
  getPaymentHistory,
  refundPayment,
};
