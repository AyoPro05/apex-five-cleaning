import mongoose from "mongoose";

const chatLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 40 },
    postcode: { type: String, trim: true, uppercase: true, maxlength: 12 },
    serviceType: { type: String, trim: true, maxlength: 80 },
    message: { type: String, trim: true, maxlength: 4000 },
    source: { type: String, default: "chat-widget", trim: true },
    conversationId: { type: String, trim: true, maxlength: 80 },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed"],
      default: "new",
    },
    ipAddress: { type: String },
    userAgent: { type: String, trim: true, maxlength: 500 },
    suspectedSpam: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspicionReasons: {
      type: [String],
      default: [],
    },
    suspicionReviewedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

chatLeadSchema.index({ createdAt: -1 });
chatLeadSchema.index({ status: 1, createdAt: -1 });

const ChatLead = mongoose.model("ChatLead", chatLeadSchema);

export default ChatLead;
