import mongoose from "mongoose";

const idempotencyRecordSchema = new mongoose.Schema({
  scope: { type: String, required: true },
  key: { type: String, required: true },
  fingerprint: { type: String, required: true },
  status: { type: String, enum: ["processing", "completed"], default: "processing", required: true },
  ownerToken: { type: String, required: true },
  leaseExpiresAt: { type: Date, required: true },
  responseStatus: Number,
  responseBody: mongoose.Schema.Types.Mixed,
  resourceType: String,
  resourceId: String,
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

idempotencyRecordSchema.index({ scope: 1, key: 1 }, { unique: true });
idempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("IdempotencyRecord", idempotencyRecordSchema);
