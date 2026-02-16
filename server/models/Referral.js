/**
 * REFERRAL MODEL
 * Tracks referral program: 5 points per referral, 20 points = 10% discount
 * Points awarded when referred user completes first booking
 */

import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  referredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  referredEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  pointsAwarded: {
    type: Number,
    default: 0,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

referralSchema.index({ referrerId: 1 });
referralSchema.index({ referredUserId: 1 });
referralSchema.index({ referredEmail: 1, referrerId: 1 }, { unique: true });

export default mongoose.model('Referral', referralSchema);
