/**
 * QUOTE PAYMENT MODEL
 * Guest payments for converted quotes (no registration required)
 */

import mongoose from 'mongoose';

const quotePaymentSchema = new mongoose.Schema({
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'GBP',
    enum: ['GBP', 'EUR', 'USD'],
  },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  cardLast4: String,
  cardBrand: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded'],
    default: 'pending',
  },
  failureReason: String,
  processedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

quotePaymentSchema.index({ quoteId: 1 });
quotePaymentSchema.index({ email: 1, quoteId: 1 });

export default mongoose.model('QuotePayment', quotePaymentSchema);
