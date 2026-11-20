// TECH-012 hotfix: optional "Additional notes" must never block a quotation.
// The live quote form always sends additionalNotes, as "" when the box is left blank.
import test from "node:test";
import assert from "node:assert/strict";
import { validateQuoteData } from "../utils/validation.js";
import { createSubmitQuoteHandler } from "./quotes.js";

const SERVICES = ["residential", "end-of-tenancy", "airbnb", "commercial"];
const base = {
  propertyType: "house", bedrooms: "2", bathrooms: "1", serviceType: "residential",
  firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", phone: "07123 456789",
  address: "1 High Street", postcode: "SS1 2BB", captchaToken: "captcha-token",
};
const ACCEPTED = [
  ["omitted", undefined, undefined],
  ["an empty string", "", undefined],
  ["whitespace only", "   \n\t ", undefined],
  ["valid text", "  Gate code 1234.  ", "Gate code 1234."],
  ["exactly 500 characters", "n".repeat(500), "n".repeat(500)],
];

for (const serviceType of SERVICES) {
  for (const [label, notes, expected] of ACCEPTED) {
    test(`TECH-012: ${serviceType} quotation is valid when notes are ${label}`, () => {
      const body = { ...base, serviceType };
      if (notes !== undefined) body.additionalNotes = notes;
      const result = validateQuoteData(body);
      assert.equal(result.isValid, true, JSON.stringify(result.errors));
      assert.equal(result.value.additionalNotes, expected);
      if (expected === undefined) assert.equal("additionalNotes" in result.value, false);
    });
  }
}

test("TECH-012: over-long and non-text notes are still rejected", () => {
  const tooLong = validateQuoteData({ ...base, additionalNotes: "x".repeat(501) });
  assert.equal(tooLong.isValid, false);
  assert.equal(tooLong.errors.additionalNotes, "Additional notes must not exceed 500 characters");
  for (const value of [null, 42, ["a"], { text: "a" }]) {
    const result = validateQuoteData({ ...base, additionalNotes: value });
    assert.equal(result.isValid, false, `rejects ${JSON.stringify(value)}`);
    assert.ok(result.errors.additionalNotes);
  }
});

test("TECH-012: blank notes do not relax any other required field", () => {
  const result = validateQuoteData({ ...base, additionalNotes: "", email: "", captchaToken: "" });
  assert.equal(result.isValid, false);
  assert.ok(result.errors.email);
  assert.ok(result.errors.captchaToken);
  assert.equal(result.errors.additionalNotes, undefined);
});

function handlerFixture(notes) {
  const saved = [];
  class QuoteModel {
    constructor(data) { Object.assign(this, { _id: "quote-1", reference: "AP12345678", confirmationEmailSent: false, adminEmailSent: false }, data); }
    async save() { saved.push(this); }
    static async findOne() { return null; }
  }
  const handler = createSubmitQuoteHandler({
    QuoteModel,
    idempotencyService: { acquire: async () => ({ kind: "disabled" }), attachResource: async () => ({}), complete: async () => ({}), release: async () => {} },
    assessSubmissionRisk: async () => ({ suspectedSpam: false, suspicionReasons: [] }),
    queue: { enqueue: async () => {} },
    queueBackgroundWork: () => {},
    drainAutomationJobs: async () => {},
    logger: { error() {}, warn() {} },
  });
  const req = { body: { ...base, additionalNotes: notes }, files: [], ip: "127.0.0.1", captcha: { score: 0.9, verified: true }, get: () => undefined };
  const res = {
    statusCode: 200, headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(key, value) { this.headers[key] = value; },
    json(payload) { this.body = payload; return this; },
  };
  return { handler, req, res, saved };
}

for (const [label, notes] of [["empty", ""], ["whitespace-only", "  \n "]]) {
  test(`TECH-012: the submit handler saves a quotation with ${label} notes (201) and stores no notes`, async () => {
    const f = handlerFixture(notes);
    await f.handler(f.req, f.res);
    assert.equal(f.res.statusCode, 201, JSON.stringify(f.res.body));
    assert.equal(f.saved.length, 1);
    assert.equal(f.saved[0].additionalNotes, undefined);
  });
}

test("TECH-012: the submit handler keeps trimmed notes and still rejects 501 characters before saving", async () => {
  const ok = handlerFixture("  Key under the mat  ");
  await ok.handler(ok.req, ok.res);
  assert.equal(ok.res.statusCode, 201);
  assert.equal(ok.saved[0].additionalNotes, "Key under the mat");
  const bad = handlerFixture("x".repeat(501));
  await bad.handler(bad.req, bad.res);
  assert.equal(bad.res.statusCode, 400);
  assert.equal(bad.saved.length, 0);
});
