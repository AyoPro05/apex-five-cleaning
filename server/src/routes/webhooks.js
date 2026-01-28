/**
 * WEBHOOK ROUTES
 * Handles Stripe and external webhooks
 */

import express from 'express';
import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import { sendPaymentReceipt, sendBookingConfirmation, sendAdminNotification, sendRefundNotification } from '../utils/emailServiceEnhanced.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * STRIPE WEBHOOK
 * POST /api/webhooks/stripe
 *
 * Handles Stripe events with signature verification
 * Events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Verify webhook signature for security
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log(`[Webhook] Received event: ${event.type} (${event.id})`);
  } catch (error) {
    console.error('[Webhook] Signature verification failed:', error.message);
    return res.status(400).json({
      error: `Webhook Error: ${error.message}`,
    });
  }

  // Process specific events
  try {
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

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Send success response to Stripe
    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    // Return 200 to prevent Stripe retries, but log the error
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * Handle payment_intent.succeeded
 */
async function handlePaymentSucceeded(paymentIntent) {
  try {
    console.log(`[Webhook] Processing payment succeeded: ${paymentIntent.id}`);

    // Find payment record
    let payment = await Payment.findOne({
      paymentIntentId: paymentIntent.id,
    });

    // If payment record doesn't exist, create it (redundancy check)
    if (!payment) {
      console.log(`[Webhook] Payment record not found, creating...`);

      const booking = await Booking.findById(paymentIntent.metadata.bookingId);
      if (!booking) {
        console.error(`[Webhook] Booking not found: ${paymentIntent.metadata.bookingId}`);
        return;
      }

      payment = new Payment({
        userId: paymentIntent.metadata.userId,
        bookingId: paymentIntent.metadata.bookingId,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert pence to pounds
        currency: paymentIntent.currency,
        status: 'completed',
      });
    } else if (payment.status === 'completed') {
      // Already processed
      console.log(`[Webhook] Payment already processed: ${payment._id}`);
      return;
    }

    // Extract card details from charge
    const charge = paymentIntent.charges.data[0];
    if (charge && charge.payment_method_details?.card) {
      const card = charge.payment_method_details.card;
      payment.cardBrand = card.brand;
      payment.cardLast4 = card.last4;
      payment.stripeChargeId = charge.id;
      payment.processedAt = new Date(charge.created * 1000);
    }

    payment.status = 'completed';
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();
    await payment.save();

    console.log(`[Webhook] Payment saved: ${payment._id}`);

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.status = 'confirmed';
      booking.paymentStatus = 'paid';
      booking.paymentId = payment._id;
      booking.paidAt = new Date();
      await booking.save();
      console.log(`[Webhook] Booking confirmed: ${booking._id}`);

      // Send confirmation emails asynchronously
      setImmediate(async () => {
        try {
          // Payment receipt
          await sendPaymentReceipt(
            {
              id: payment.paymentIntentId,
              amount: payment.amount * 100,
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
            true
          );

          // Booking confirmation
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
              amount: payment.amount * 100,
              cardBrand: payment.cardBrand,
              cardLast4: payment.cardLast4,
            },
            true
          );

          // Admin notification
          await sendAdminNotification(
            'New Payment Received (Webhook)',
            {
              bookingId: booking._id,
              amount: (payment.amount).toFixed(2),
              currency: payment.currency,
              customerEmail: booking.email,
              customerName: `${booking.firstName} ${booking.lastName}`,
              serviceType: booking.serviceType,
              cardBrand: payment.cardBrand,
              cardLast4: payment.cardLast4,
              timestamp: new Date().toISOString(),
            },
            null,
            true
          );

          console.log(`[Email] Confirmation emails queued for ${booking.email}`);
        } catch (emailError) {
          console.error('[Email] Error sending emails:', emailError);
        }
      });
    }
  } catch (error) {
    console.error('[Webhook] Error handling payment succeeded:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.payment_failed
 */
async function handlePaymentFailed(paymentIntent) {
  try {
    console.log(`[Webhook] Processing payment failed: ${paymentIntent.id}`);

    const payment = await Payment.findOne({
      paymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      console.warn(`[Webhook] Payment record not found: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    payment.status = 'failed';
    payment.failureCode = paymentIntent.last_payment_error?.code;
    payment.failureMessage = paymentIntent.last_payment_error?.message;
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();
    await payment.save();

    console.log(`[Webhook] Payment failed saved: ${payment._id}`);

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
      console.log(`[Webhook] Booking payment status updated to failed: ${booking._id}`);

      // Send admin notification
      setImmediate(async () => {
        try {
          await sendAdminNotification(
            'Payment Failed',
            {
              bookingId: booking._id,
              paymentId: payment._id,
              amount: (payment.amount).toFixed(2),
              errorCode: payment.failureCode,
              errorMessage: payment.failureMessage,
              customerEmail: booking.email,
              timestamp: new Date().toISOString(),
            },
            null,
            true
          );
        } catch (emailError) {
          console.error('[Email] Error sending failure notification:', emailError);
        }
      });
    }
  } catch (error) {
    console.error('[Webhook] Error handling payment failed:', error);
    throw error;
  }
}

/**
 * Handle charge.refunded
 */
async function handleChargeRefunded(charge) {
  try {
    console.log(`[Webhook] Processing refund: ${charge.id}`);

    // Find payment by charge ID
    const payment = await Payment.findOne({
      stripeChargeId: charge.id,
    });

    if (!payment) {
      console.warn(`[Webhook] Payment not found for charge: ${charge.id}`);
      return;
    }

    // Update refund information
    const totalRefundedPence = charge.refunds.data.reduce((sum, refund) => sum + refund.amount, 0);
    const totalRefundedPounds = totalRefundedPence / 100;

    payment.status = 'refunded';
    payment.refundAmount = totalRefundedPounds;
    payment.refundId = charge.refunds.data[0]?.id;
    payment.refundReason = charge.refunds.data[0]?.reason || 'Unknown';
    payment.refundProcessedAt = new Date(charge.refunds.data[0]?.created * 1000);
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();
    await payment.save();

    console.log(`[Webhook] Refund processed: ${payment._id} (£${totalRefundedPounds.toFixed(2)})`);

    // Update booking
    const booking = await Booking.findById(payment.bookingId);
    if (booking) {
      booking.status = 'cancelled';
      booking.paymentStatus = 'refunded';
      await booking.save();
      console.log(`[Webhook] Booking cancelled: ${booking._id}`);

      // Send refund notification
      setImmediate(async () => {
        try {
          await sendRefundNotification(
            {
              id: payment.paymentIntentId,
              refundAmount: totalRefundedPence,
              refundProcessedAt: payment.refundProcessedAt,
              cardBrand: payment.cardBrand,
              cardLast4: payment.cardLast4,
            },
            {
              id: booking._id,
              email: booking.email,
              serviceName: booking.serviceName,
              date: booking.date,
              serviceArea: booking.serviceArea,
            },
            payment.refundReason,
            true
          );

          console.log(`[Email] Refund notification queued for ${booking.email}`);
        } catch (emailError) {
          console.error('[Email] Error sending refund email:', emailError);
        }
      });
    }
  } catch (error) {
    console.error('[Webhook] Error handling refund:', error);
    throw error;
  }
}

/**
 * Handle payment_intent.canceled
 */
async function handlePaymentCanceled(paymentIntent) {
  try {
    console.log(`[Webhook] Processing payment canceled: ${paymentIntent.id}`);

    const payment = await Payment.findOne({
      paymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      console.warn(`[Webhook] Payment not found: ${paymentIntent.id}`);
      return;
    }

    payment.status = 'cancelled';
    payment.webhookReceived = true;
    payment.webhookReceivedAt = new Date();
    await payment.save();

    console.log(`[Webhook] Payment cancelled: ${payment._id}`);
  } catch (error) {
    console.error('[Webhook] Error handling payment canceled:', error);
    throw error;
  }
}

export default router;
