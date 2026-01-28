/**
 * PAYMENT MODEL
 * Stores payment transaction information
 */

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking reference is required']
  },

  // Payment Details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  currency: {
    type: String,
    default: 'GBP',
    enum: ['GBP', 'EUR', 'USD']
  },

  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal'],
    default: 'card'
  },

  // Card Information (Only last 4 digits stored for security)
  cardLast4: String,
  cardBrand: String,
  cardExpiry: String,

  // Stripe Information
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeCustomerId: String,

  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },

  // Error Information
  failureReason: String,
  failureCode: String,

  // Receipt
  receiptUrl: String,
  receiptNumber: String,

  // Refund Information
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundReason: String,
  refundedAt: Date,

  // Metadata
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: Date,

  // Webhook Tracking
  webhookReceived: {
    type: Boolean,
    default: false
  },
  webhookReceivedAt: Date
});

// ============================================
// INDEXES
// ============================================

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

// ============================================
// METHODS
// ============================================

/**
 * Get payment status label
 */
paymentSchema.methods.getStatusLabel = function() {
  const labels = {
    pending: '⏳ Pending',
    processing: '⚙️ Processing',
    succeeded: '✅ Succeeded',
    failed: '❌ Failed',
    cancelled: '🚫 Cancelled',
    refunded: '↩️ Refunded'
  };
  return labels[this.status] || this.status;
};

/**
 * Mark payment as succeeded
 */
paymentSchema.methods.markAsSucceeded = function() {
  this.status = 'succeeded';
  this.processedAt = new Date();
  return this.save();
};

/**
 * Mark payment as failed
 */
paymentSchema.methods.markAsFailed = function(reason, code) {
  this.status = 'failed';
  this.failureReason = reason;
  this.failureCode = code;
  return this.save();
};

/**
 * Process refund
 */
paymentSchema.methods.processRefund = function(amount, reason) {
  if (this.status !== 'succeeded') {
    throw new Error('Can only refund succeeded payments');
  }
  this.status = 'refunded';
  this.refundedAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

export default mongoose.model('Payment', paymentSchema);
