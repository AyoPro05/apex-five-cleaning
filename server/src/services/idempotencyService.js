import { createHash, randomUUID as defaultRandomUUID } from "node:crypto";
import IdempotencyRecord from "../models/IdempotencyRecord.js";
import Quote from "../models/Quote.js";

const LEASE_MS = 5 * 60_000;
const RETENTION_MS = 24 * 60 * 60_000;

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

export function fingerprintRequest(normalizedBody, files = []) {
  const images = (files || []).map((file) => {
    const buffer = file.buffer || Buffer.alloc(0);
    return {
      hash: createHash("sha256").update(buffer).digest("hex"),
      mimeType: file.mimetype || "",
      length: buffer.length,
    };
  });
  return createHash("sha256").update(JSON.stringify(stableValue({ body: normalizedBody, images }))).digest("hex");
}

async function resolveQuery(query) {
  return typeof query?.lean === "function" ? query.lean() : query;
}

export function createIdempotencyService({
  model = IdempotencyRecord,
  QuoteModel = Quote,
  now = () => new Date(),
  randomUUID = defaultRandomUUID,
} = {}) {
  let readiness;
  const timestamp = () => new Date(now());
  async function ensureReady() {
    if (!readiness) {
      readiness = Promise.all([model, QuoteModel].map((Model) => typeof Model?.init === "function" ? Model.init() : undefined));
    }
    await readiness;
  }
  const ownedFilter = ({ recordId, ownerToken }) => ({ _id: recordId, status: "processing", ownerToken });
  const updateRecord = (filter, update) => resolveQuery(model.findOneAndUpdate(filter, update, { new: true, runValidators: true }));

  async function acquire({ scope, key, fingerprint }) {
    if (typeof key !== "string" || key.length < 8 || key.length > 128 || !/^[A-Za-z0-9_.:-]+$/.test(key)) {
      return { kind: "disabled" };
    }
    await ensureReady();
    const filter = { scope, key };
    let record = await resolveQuery(model.findOne(filter));
    const current = timestamp();
    const ownerToken = randomUUID();
    if (!record) {
      try {
        record = await model.create({
          ...filter, fingerprint, ownerToken, status: "processing",
          leaseExpiresAt: new Date(current.getTime() + LEASE_MS),
          expiresAt: new Date(current.getTime() + RETENTION_MS),
        });
        return { kind: "acquired", record, ownerToken };
      } catch (error) {
        if (error.code !== 11000) throw error;
        record = await resolveQuery(model.findOne(filter));
        if (!record) throw error;
      }
    }
    if (record.fingerprint !== fingerprint) return { kind: "conflict" };
    if (record.status === "completed") return { kind: "replay", status: record.responseStatus, body: record.responseBody };
    if (new Date(record.leaseExpiresAt) > current) return { kind: "in-progress" };
    const claimed = await updateRecord({
      ...filter, _id: record._id, fingerprint, status: "processing",
      leaseExpiresAt: { $lte: current },
    }, { $set: {
      ownerToken,
      leaseExpiresAt: new Date(current.getTime() + LEASE_MS),
      expiresAt: new Date(current.getTime() + RETENTION_MS),
    } });
    if (claimed) return { kind: "acquired", record: claimed, ownerToken };
    const winner = await resolveQuery(model.findOne(filter));
    if (winner?.status === "completed") return { kind: "replay", status: winner.responseStatus, body: winner.responseBody };
    return { kind: "in-progress" };
  }

  async function attachResource({ recordId, ownerToken, resourceType, resourceId }) {
    return updateRecord(ownedFilter({ recordId, ownerToken }), { $set: { resourceType, resourceId: String(resourceId) } });
  }

  async function complete({ recordId, ownerToken, status, body }) {
    return updateRecord(ownedFilter({ recordId, ownerToken }), {
      $set: { status: "completed", responseStatus: status, responseBody: body, expiresAt: new Date(timestamp().getTime() + RETENTION_MS) },
    });
  }

  async function release(owner) {
    const filter = ownedFilter(owner);
    const record = await resolveQuery(model.findOne(filter));
    if (!record || record.resourceId) return { deletedCount: 0 };
    const quote = await resolveQuery(QuoteModel.findOne({ idempotencyRecordId: owner.recordId }));
    if (quote) return { deletedCount: 0 };
    return model.deleteOne({ ...filter, resourceId: { $exists: false } });
  }

  return { acquire, attachResource, complete, release };
}

export const defaultIdempotencyService = createIdempotencyService();
