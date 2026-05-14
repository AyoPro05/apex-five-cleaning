import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    startTime: {
      type: String,
      trim: true,
      default: '',
    },
    endTime: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false },
);

const staffSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    role: {
      type: String,
      enum: ['cleaner', 'supervisor', 'admin'],
      default: 'cleaner',
      index: true,
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contractor'],
      default: 'part-time',
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    serviceAreas: [{
      type: String,
      trim: true,
    }],
    availability: [availabilitySlotSchema],
    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

staffSchema.index({ firstName: 1, lastName: 1 });

staffSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

staffSchema.set('toJSON', { virtuals: true });
staffSchema.set('toObject', { virtuals: true });

export default mongoose.model('Staff', staffSchema);
