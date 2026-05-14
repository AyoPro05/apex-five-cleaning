import mongoose from 'mongoose';

const staffShiftSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quote',
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    breakMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
    hoursWorked: {
      type: Number,
      min: 0,
      required: true,
    },
    hourlyRateSnapshot: {
      type: Number,
      min: 0,
      required: true,
    },
    payAmount: {
      type: Number,
      min: 0,
      required: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'approved', 'paid', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    approvedAt: Date,
    paidAt: Date,
    createdBy: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

staffShiftSchema.index({ staffId: 1, date: -1 });
staffShiftSchema.index({ status: 1, date: -1 });

export default mongoose.model('StaffShift', staffShiftSchema);
