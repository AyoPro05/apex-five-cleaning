/**
 * BOOKING MODEL
 * Stores booking information for services
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },

  // Service Information
  serviceId: {
    type: String,
    enum: ['residential', 'end-of-tenancy', 'airbnb'],
    required: [true, 'Service type is required']
  },
  serviceName: String,

  // Booking Details
  date: {
    type: Date,
    required: [true, 'Booking date is required']
  },
  time: {
    type: String,
    required: [true, 'Booking time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 1,
    max: 12
  },

  // Service Area
  serviceArea: {
    type: String,
    required: [true, 'Service area is required'],
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

  // Pricing
  basePrice: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
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

module.exports = mongoose.model('Booking', bookingSchema);
