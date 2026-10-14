import mongoose from "mongoose";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

const automationRunSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    finishedAt: Date,
    trigger: { type: String, required: true, trim: true, maxlength: 80 },
    workerId: { type: String, required: true, trim: true, maxlength: 200 },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      required: true,
      default: "running",
      index: true,
    },
    counts: {
      enqueued: { type: Number, default: 0, min: 0 },
      completed: { type: Number, default: 0, min: 0 },
      retried: { type: Number, default: 0, min: 0 },
      failed: { type: Number, default: 0, min: 0 },
      purged: { type: Number, default: 0, min: 0 },
    },
    errorSummary: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

automationRunSchema.index(
  { startedAt: 1 },
  { expireAfterSeconds: THIRTY_DAYS_SECONDS },
);

const AutomationRun = mongoose.model("AutomationRun", automationRunSchema);

export default AutomationRun;
