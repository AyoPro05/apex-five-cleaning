import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    // Property Details
    propertyType: {
      type: String,
      enum: ["house", "flat", "bungalow"],
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

// Index for better query performance
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ status: 1 });

const Quote = mongoose.model("Quote", quoteSchema);

export default Quote;
