import test from "node:test";
import assert from "node:assert/strict";
import Quote from "../models/Quote.js";
import { createQuoteWorkflowService } from "./quoteWorkflowService.js";

function fixture() {
  let quote = { _id: "quote-1", status: "new", responseVersion: 0, reference: "AP12345678", email: "ada@example.com", firstName: "Ada", serviceType: "residential", approvedAmount: undefined };
  let booking;
  const jobs = new Map();
  let bookingCreates = 0;
  function matches(filter, value) {
    return Object.entries(filter).every(([key, expected]) => {
      if (expected && typeof expected === "object" && !(expected instanceof Date)) {
        if ("$ne" in expected) return value[key] !== expected.$ne;
        if ("$exists" in expected) return (value[key] !== undefined) === expected.$exists;
      }
      return expected instanceof Date ? value[key]?.getTime() === expected.getTime() : value[key] === expected;
    });
  }
  const QuoteModel = {
    async findOne(filter) { return matches(filter, quote) ? { ...quote } : null; },
    async findOneAndUpdate(filter, update) {
      if (!matches(filter, quote)) return null;
      Object.assign(quote, update.$set);
      for (const key of Object.keys(update.$unset || {})) delete quote[key];
      return { ...quote };
    },
  };
  const BookingModel = {
    async init() {},
    async findOne() { return booking ? { ...booking } : null; },
    async findOneAndUpdate(filter, update) {
      if (!booking) { bookingCreates += 1; booking = { _id: "booking-1", ...update.$setOnInsert }; }
      return { ...booking };
    },
    async updateOne(filter, update) { if (booking && matches(filter, booking)) Object.assign(booking, update.$set); },
  };
  const queue = { async enqueue(job) { if (!jobs.has(job.dedupeKey)) jobs.set(job.dedupeKey, { _id: `job-${jobs.size + 1}`, status: "pending", ...job }); return jobs.get(job.dedupeKey); } };
  return { QuoteModel, BookingModel, queue, jobs, get quote() { return quote; }, get booking() { return booking; }, get bookingCreates() { return bookingCreates; }, service: createQuoteWorkflowService({ QuoteModel, BookingModel, queue, now: () => new Date("2026-10-14T08:00:00Z") }) };
}

test("quote schema persists approval response fields written by the workflow", () => {
  const query = Quote.updateOne({}, { $set: { responseVersion: 1, customerMessage: "Welcome" } });
  assert.deepEqual(query._castUpdate(query.getUpdate()), {
    $set: { responseVersion: 1, customerMessage: "Welcome" },
  });
});

test("conversion rejects invalid amounts and unknown customer fields before any write", async () => {
  for (const input of [{ status: "converted" }, { status: "converted", approvedAmount: 0 }, { status: "converted", approvedAmount: Infinity }, { status: "converted", approvedAmount: 1000001 }, { status: "converted", approvedAmount: 1, customerMessage: "x".repeat(1001) }, { arbitrary: "input" }]) {
    const data = fixture();
    await assert.rejects(data.service.updateQuote({ quoteId: "quote-1", input }), (error) => error.status === 400);
    assert.equal(data.quote.status, "new");
    assert.equal(data.bookingCreates, 0);
    assert.equal(data.jobs.size, 0);
  }
});

test("conversion replays converge on one booking and one response version", async () => {
  const data = fixture();
  const input = { status: "converted", approvedAmount: 125.126, adminNotes: "Internal only", customerMessage: "Welcome" };
  const first = await data.service.updateQuote({ quoteId: "quote-1", input });
  const replay = await data.service.updateQuote({ quoteId: "quote-1", input });
  assert.equal(first.quote.responseVersion, 1);
  assert.equal(replay.quote.responseVersion, 1);
  assert.equal(data.bookingCreates, 1);
  assert.equal(data.booking.totalPrice, 125.13);
  assert.equal(data.quote.linkedBookingId, "booking-1");
  assert.equal([...data.jobs.values()].filter((job) => job.type === "quote.approved-response").length, 1);
  assert.doesNotMatch(JSON.stringify([...data.jobs.values()]), /Internal only|adminNotes/);
});

test("changing the customer response advances its version and leaves scheduled booking prices alone", async () => {
  const data = fixture();
  await data.service.updateQuote({ quoteId: "quote-1", input: { status: "converted", approvedAmount: 125 } });
  data.booking.status = "confirmed";
  await data.service.updateQuote({ quoteId: "quote-1", input: { status: "converted", approvedAmount: 150, customerMessage: "Changed scope" } });
  assert.equal(data.quote.responseVersion, 2);
  assert.equal(data.booking.totalPrice, 125);
  assert.equal([...data.jobs.values()].filter((job) => job.type === "quote.approved-response").length, 2);
});

test("replaying a partially interrupted conversion repairs missing work", async () => {
  const data = fixture();
  const enqueue = data.queue.enqueue;
  data.queue.enqueue = async () => { throw new Error("queue temporarily unavailable"); };
  await assert.rejects(data.service.updateQuote({ quoteId: "quote-1", input: { status: "converted", approvedAmount: 125 } }), /queue temporarily/);
  assert.equal(data.quote.status, "converted");
  data.queue.enqueue = enqueue;
  await data.service.updateQuote({ quoteId: "quote-1", input: { status: "converted", approvedAmount: 125 } });
  assert.equal(data.quote.responseVersion, 1);
  assert.equal(data.bookingCreates, 1);
  assert.equal(data.jobs.size, 3);
});

test("a booking unique-index race loads and links the winning draft", async () => {
  const data = fixture();
  data.BookingModel.findOneAndUpdate = async () => { throw Object.assign(new Error("duplicate"), { code: 11000 }); };
  data.BookingModel.findOne = async () => ({ _id: "winning-booking", status: "draft", quoteId: "quote-1" });
  const result = await data.service.updateQuote({ quoteId: "quote-1", input: { status: "converted", approvedAmount: 125 } });
  assert.equal(result.quote.linkedBookingId, "winning-booking");
});

test("concurrent conversions converge without creating an extra email version", async () => {
  const data = fixture();
  await Promise.all(Array.from({ length: 4 }, () => data.service.updateQuote({ quoteId: "quote-1", input: { status: "converted", approvedAmount: 125 } })));
  assert.equal(data.quote.responseVersion, 1);
  assert.equal(data.bookingCreates, 1);
  assert.equal([...data.jobs.values()].filter((job) => job.type === "quote.approved-response").length, 1);
});
