import mongoose from "mongoose";

const automationJobSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true, index: true },
    dedupeKey: { type: String, required: true, trim: true, unique: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: true, trim: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1, max: 10 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    lockedAt: Date,
    lockExpiresAt: { type: Date, index: true },
    lockedBy: { type: String, trim: true },
    leaseToken: { type: String, trim: true },
    completedAt: Date,
    lastError: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

automationJobSchema.index({ status: 1, nextAttemptAt: 1, lockExpiresAt: 1 });
automationJobSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AutomationJob = mongoose.model("AutomationJob", automationJobSchema);

export default AutomationJob;
