/**
 * SAVED ADDRESS MODEL
 * Full address details including postcode for GDPR/data residency
 */

import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  label: {
    type: String,
    trim: true,
    default: 'Home',
  },
  street: {
    type: String,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  postCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  country: {
    type: String,
    default: 'UK',
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

addressSchema.index({ userId: 1 });

export default mongoose.model('Address', addressSchema);
