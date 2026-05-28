/**
 * BOOKING MODEL
 * Stores booking information for services
 */

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  // Reference (optional for guest-originating drafts created from approved quotes;
  // linked to a User when the customer registers with a matching email)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Quote linkage (populated when this booking was auto-created from a converted quote)
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote',
    index: true
  },
  quoteReference: {
    type: String,
    trim: true,
    uppercase: true,
    index: true
  },

  // Customer snapshot (used for guest drafts before they register)
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  customerFirstName: { type: String, trim: true },
  customerLastName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },

  // Service Information
  serviceId: {
    type: String,
    enum: ['residential', 'end-of-tenancy', 'airbnb', 'commercial']
  },
  serviceName: String,

  // Booking Details (optional for drafts — admin sets these before confirming)
  date: {
    type: Date
  },
  time: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  duration: {
    type: Number,
    min: 1,
    max: 12
  },

  // Service Area (optional for drafts)
  serviceArea: {
    type: String,
    enum: [
      'Canterbury', 'Dover', 'Maidstone', 'Tunbridge Wells', 'Sevenoaks', 'Ashford',
      'Sheerness-on-Sea', 'Sittingbourne', 'Axminster', 'Croydon'
    ]
  },

  // Address for cleaning
  address: {
    street: String,
    city: String,
    postCode: String,
    country: { type: String, default: 'UK' }
  },

  // Special Notes
  notes: {
    type: String,
    maxlength: 500
  },

  // Pricing (default 0 for drafts; final values set when admin confirms scope)
  basePrice: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },

  // Status — "draft" used for auto-created bookings awaiting admin scheduling
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },

  // Cleaning Staff
  assignedCleaner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cleanerNotes: String,

  // Photos/Evidence
  beforePhotos: [String],
  afterPhotos: [String],

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,

  // Automation: satisfaction follow-up email sent 48h after completion (one-shot)
  satisfactionEmailSentAt: Date,

  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,

  // Ratings & Reviews
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  reviewDate: Date
});

// ============================================
// INDEXES
// ============================================

bookingSchema.index({ userId: 1, date: -1 });
bookingSchema.index({ date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

// ============================================
// METHODS
// ============================================

/**
 * Check if booking can be cancelled
 */
bookingSchema.methods.canBeCancelled = function() {
  // Can only cancel if status is pending or confirmed
  if (!['pending', 'confirmed'].includes(this.status)) {
    return false;
  }
  // Can't cancel if within 24 hours
  const hoursUntilBooking = (this.date - Date.now()) / (1000 * 60 * 60);
  return hoursUntilBooking > 24;
};

/**
 * Check if booking can be rescheduled
 */
bookingSchema.methods.canBeRescheduled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

/**
 * Get booking status label
 */
bookingSchema.methods.getStatusLabel = function() {
  const labels = {
    pending: '⏳ Pending Confirmation',
    confirmed: '✅ Confirmed',
    'in-progress': '🔄 In Progress',
    completed: '✔️ Completed',
    cancelled: '❌ Cancelled',
    rescheduled: '🔁 Rescheduled'
  };
  return labels[this.status] || this.status;
};

export default mongoose.model('Booking', bookingSchema);
