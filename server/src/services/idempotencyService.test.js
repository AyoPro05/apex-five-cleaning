import test from "node:test";
import assert from "node:assert/strict";
import { createIdempotencyService, fingerprintRequest } from "./idempotencyService.js";
import IdempotencyRecord from "../models/IdempotencyRecord.js";
import Quote from "../models/Quote.js";

const START = new Date("2026-10-14T08:00:00Z");
const request = { scope: "POST:/api/quotes/submit", key: "quote-key-123", fingerprint: "original" };
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value && typeof value === "object" && !(value instanceof Date)) {
      if ("$lte" in value) return row[key] <= value.$lte;
      if ("$exists" in value) return (row[key] !== undefined) === value.$exists;
      if ("$in" in value) return value.$in.includes(row[key]);
    }
    return String(row[key]) === String(value);
  });
}
function fixture(initial = [], linkedQuote = null) {
  const rows = structuredClone(initial);
  let clock = START;
  let token = 0;
  const calls = [];
  const model = {
    init: async () => { calls.push("idempotency ready"); },
    findOne: async (filter) => structuredClone(rows.find((row) => matches(row, filter)) || null),
    create: async (input) => {
      assert.ok(calls.includes("idempotency ready"));
      assert.ok(calls.includes("quote ready"));
      if (rows.some((row) => row.scope === input.scope && row.key === input.key)) {
        throw Object.assign(new Error("duplicate"), { code: 11000 });
      }
      const row = { _id: `record-${rows.length + 1}`, ...input };
      rows.push(row);
      return structuredClone(row);
    },
    findOneAndUpdate: async (filter, update) => {
      const row = rows.find((item) => matches(item, filter));
      if (!row) return null;
      Object.assign(row, update.$set);
      for (const key of Object.keys(update.$unset || {})) delete row[key];
      return structuredClone(row);
    },
    deleteOne: async (filter) => {
      const index = rows.findIndex((row) => matches(row, filter));
      if (index === -1) return { deletedCount: 0 };
      rows.splice(index, 1);
      return { deletedCount: 1 };
    },
  };
  const QuoteModel = {
    init: async () => { calls.push("quote ready"); },
    findOne: async (filter) => linkedQuote?.idempotencyRecordId === filter.idempotencyRecordId ? linkedQuote : null,
  };
  const service = createIdempotencyService({ model, QuoteModel, now: () => clock, randomUUID: () => `owner-${++token}` });
  return { service, rows, calls, model, setTime: (time) => { clock = time; } };
}
function processing(overrides = {}) {
  return { _id: "record-1", ...request, status: "processing", ownerToken: "previous", leaseExpiresAt: new Date(START.getTime() + 1000), ...overrides };
}
const owned = (acquired) => ({ recordId: acquired.record._id, ownerToken: acquired.ownerToken });

test("fingerprints sort nested object keys and hash uploaded bytes, MIME type and length", () => {
  assert.equal(fingerprintRequest({ b: 2, a: { y: 1, x: 3 } }, []), fingerprintRequest({ a: { x: 3, y: 1 }, b: 2 }, []));
  const image = { buffer: Buffer.from("image"), mimetype: "image/jpeg", originalname: "first.jpg" };
  const baseline = fingerprintRequest({}, [image]);
  assert.equal(baseline, fingerprintRequest({}, [{ ...image, originalname: "second.jpg" }]));
  assert.notEqual(baseline, fingerprintRequest({}, [{ ...image, buffer: Buffer.from("other") }]));
  assert.notEqual(baseline, fingerprintRequest({}, [{ ...image, mimetype: "image/png" }]));
});

test("schema enforces unique scoped keys, expiresAt TTL and sparse unique quote linkage", () => {
  assert.ok(IdempotencyRecord.schema.indexes().some(([keys, options]) => keys.scope === 1 && keys.key === 1 && options.unique));
  assert.ok(IdempotencyRecord.schema.indexes().some(([keys, options]) => keys.expiresAt === 1 && options.expireAfterSeconds === 0));
  const field = Quote.schema.path("idempotencyRecordId");
  assert.equal(field.options.unique, true);
  assert.equal(field.options.sparse, true);
});

test("invalid and missing keys disable idempotency without touching storage", async () => {
  const { service, calls } = fixture();
  for (const key of [undefined, "short", "contains spaces", "x".repeat(129)]) {
    assert.deepEqual(await service.acquire({ ...request, key }), { kind: "disabled" });
  }
  assert.deepEqual(calls, []);
});

test("acquisition awaits index readiness before creating a record", async () => {
  const { service, rows, calls } = fixture();
  const result = await service.acquire(request);
  assert.equal(result.kind, "acquired");
  assert.equal(rows.length, 1);
  assert.deepEqual(calls, ["idempotency ready", "quote ready"]);
  assert.equal(result.ownerToken, rows[0].ownerToken);
  assert.ok(rows[0].expiresAt > START);
});

test("changed payload conflicts even if its lease expired", async () => {
  const { service } = fixture([processing({ leaseExpiresAt: START })]);
  assert.equal((await service.acquire({ ...request, fingerprint: "changed" })).kind, "conflict");
});

test("completed requests replay their original status and body", async () => {
  const body = { success: true, quoteId: "quote-1" };
  const { service } = fixture([processing({ status: "completed", responseStatus: 201, responseBody: body })]);
  assert.deepEqual(await service.acquire(request), { kind: "replay", status: 201, body });
});

test("active matching lease is in progress", async () => {
  const { service } = fixture([processing()]);
  assert.equal((await service.acquire(request)).kind, "in-progress");
});

test("expired lease takeover preserves resource and fences stale owner mutations", async () => {
  const { service, rows } = fixture([processing({ leaseExpiresAt: START, resourceType: "Quote", resourceId: "quote-1" })]);
  const result = await service.acquire(request);
  assert.equal(result.kind, "acquired");
  assert.equal(result.record.resourceId, "quote-1");
  assert.notEqual(result.ownerToken, "previous");
  assert.equal(await service.attachResource({ recordId: "record-1", ownerToken: "previous", resourceType: "Quote", resourceId: "wrong" }), null);
  assert.equal(await service.complete({ recordId: "record-1", ownerToken: "previous", status: 201, body: {} }), null);
  await service.release({ recordId: "record-1", ownerToken: "previous" });
  assert.equal(rows.length, 1);
});

test("duplicate-key race refetches winner and gives one owner", async () => {
  const { service, rows } = fixture();
  const outcomes = await Promise.all([service.acquire(request), service.acquire(request)]);
  assert.deepEqual(outcomes.map((result) => result.kind).sort(), ["acquired", "in-progress"]);
  assert.equal(rows.length, 1);
});

test("racing expired takeovers give one owner", async () => {
  const { service } = fixture([processing({ leaseExpiresAt: START })]);
  const results = await Promise.all([service.acquire(request), service.acquire(request)]);
  assert.deepEqual(results.map((result) => result.kind).sort(), ["acquired", "in-progress"]);
});

test("owned attachment and completion persist the exact replay response", async () => {
  const { service } = fixture();
  const acquisition = await service.acquire(request);
  const owner = owned(acquisition);
  await service.attachResource({ ...owner, resourceType: "Quote", resourceId: "quote-1" });
  await service.complete({ ...owner, status: 201, body: { quoteId: "quote-1", reference: "AP12345678" } });
  assert.deepEqual(await service.acquire(request), { kind: "replay", status: 201, body: { quoteId: "quote-1", reference: "AP12345678" } });
});

test("release removes only owned records without persisted resources", async () => {
  const { service, rows } = fixture();
  const acquisition = await service.acquire(request);
  await service.release(owned(acquisition));
  assert.equal(rows.length, 0);
});

test("release preserves quote saved before resource attachment", async () => {
  const { service, rows } = fixture([processing()], { _id: "quote-1", idempotencyRecordId: "record-1" });
  await service.release({ recordId: "record-1", ownerToken: "previous" });
  assert.equal(rows.length, 1);
});

test("release preserves attached resources", async () => {
  const { service, rows } = fixture([processing({ resourceType: "Quote", resourceId: "quote-1" })]);
  await service.release({ recordId: "record-1", ownerToken: "previous" });
  assert.equal(rows.length, 1);
});
