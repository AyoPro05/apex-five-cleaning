/**
 * USER MODEL
 * Stores member and admin user information
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\d{10,15}$/, 'Please provide a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false // Don't return password by default
  },

  // Address
  address: {
    street: String,
    city: String,
    postCode: String,
    country: { type: String, default: 'UK' }
  },

  // Role & Permissions
  role: {
    type: String,
    enum: ['member', 'admin'],
    default: 'member'
  },

  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiry: Date,

  // Password Reset
  passwordResetToken: String,
  passwordResetExpiry: Date,

  // Stripe Integration
  stripeCustomerId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Payment Methods (references to saved cards)
  defaultPaymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },

  // Preferences
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  emailNotifications: {
    bookingConfirmation: { type: Boolean, default: true },
    bookingReminder: { type: Boolean, default: true },
    paymentReceipt: { type: Boolean, default: true },
    promotional: { type: Boolean, default: false }
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
});

// ============================================
// INDEXES
// ============================================

userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// METHODS
// ============================================

/**
 * Compare password with hashed password
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Get full name
 */
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

/**
 * Check if account is locked (after failed login attempts)
 */
userSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Increment login attempts
 */
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts
  const maxAttempts = 5;
  const lockTimeMinutes = 2;
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTimeMinutes * 60 * 1000) };
  }
  return this.updateOne(updates);
};

/**
 * Reset login attempts
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

export default mongoose.model('User', userSchema);
