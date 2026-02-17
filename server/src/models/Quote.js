import mongoose from "mongoose";

/**
 * Generate unique quote reference: AP + 8 digits (e.g. AP12345678)
 */
function generateQuoteReference() {
  const digits = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `AP${digits}`;
}

const quoteSchema = new mongoose.Schema(
  {
    // Human-readable reference (AP + 8 digits) - used in emails, Pay Online, display
    reference: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // Property Details
    propertyType: {
      type: String,
      enum: ["house", "flat", "bungalow", "commercial", "sharehouse-room"],
      required: true,
    },
    bedrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },
    bathrooms: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },

    // Service Details
    serviceType: {
      type: String,
      enum: ["residential", "end-of-tenancy", "airbnb", "commercial"],
      required: true,
    },

    // Contact Information
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    postcode: {
      type: String,
      trim: true,
      uppercase: true,
    },

    // Additional Information
    additionalNotes: {
      type: String,
      trim: true,
    },

    // Additional services (customer can select multiple)
    additionalServices: [{ type: String, trim: true }],

    // Property images (max 5) - URLs or paths from upload
    images: [{ url: String, filename: String }],

    // CAPTCHA Verification
    captchaScore: {
      type: Number,
      default: 0,
    },
    captchaVerified: {
      type: Boolean,
      default: false,
    },

    // Status Tracking
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "rejected"],
      default: "new",
    },

    // Admin Notes
    adminNotes: {
      type: String,
      trim: true,
    },

    // Payment (set when admin converts - allows guest pay online)
    approvedAmount: {
      type: Number,
      min: 0,
    },

    // Email Status
    confirmationEmailSent: {
      type: Boolean,
      default: false,
    },
    adminEmailSent: {
      type: Boolean,
      default: false,
    },

    // IP Address for spam tracking
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Generate reference before first save
quoteSchema.pre("save", function (next) {
  if (!this.reference) {
    this.reference = generateQuoteReference();
  }
  next();
});

// Index for better query performance (reference already has unique index)
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ status: 1 });

const Quote = mongoose.model("Quote", quoteSchema);

export default Quote;
