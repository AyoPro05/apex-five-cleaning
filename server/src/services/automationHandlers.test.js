import assert from "node:assert/strict";
import test from "node:test";
import axios from "axios";
import sgMail from "@sendgrid/mail";
import nodemailer from "nodemailer";

import { createAutomationHandlers } from "./automationHandlers.js";
import { dispatchEvent, emitEvent, verifyEventSignature } from "../utils/eventBus.js";

const NOW = new Date("2026-10-14T08:00:00.000Z");

function makeQuote(overrides = {}) {
  return {
    _id: "quote-1",
    reference: "AP12345678",
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "07123456789",
    postcode: "SS1 2BB",
    serviceType: "residential",
    propertyType: "house",
    bedrooms: 3,
    bathrooms: 2,
    status: "new",
    isDeleted: false,
    createdAt: new Date("2026-10-12T08:00:00.000Z"),
    ...overrides,
  };
}

function quoteModelFor(quote, updates = []) {
  return {
    async findById(id) {
      assert.equal(id, "quote-1");
      return quote;
    },
    async updateOne(...args) {
      updates.push(args);
      return { acknowledged: true, modifiedCount: 1 };
    },
  };
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("createAutomationHandlers registers every supported automation type", () => {
  const handlers = createAutomationHandlers();

  assert.deepEqual(Object.keys(handlers).sort(), [
    "booking.satisfaction-follow-up",
    "chat-lead.hot-webhook",
    "chat-lead.spam-alert",
    "domain.event",
    "ops.daily-digest",
    "quote.admin-notification",
    "quote.approved-response",
    "quote.client-confirmation",
    "quote.client-follow-up",
    "quote.lead-webhook",
    "quote.payment-reminder",
    "quote.spam-alert",
    "quote.stuck-reminder",
  ]);
});

test("client confirmation throws and does not stamp success when mail reports failure", async () => {
  const updates = [];
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote(), updates),
    sendClientConfirmationEmail: async () => ({
      success: false,
      error: "smtp unavailable",
    }),
  });

  await assert.rejects(
    handlers["quote.client-confirmation"]({
      entityId: "quote-1",
      payload: {},
    }),
    /smtp unavailable/,
  );
  assert.equal(updates.length, 0);
});

test("client confirmation stamps only its legacy success field after delivery", async () => {
  const updates = [];
  const calls = [];
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote(), updates),
    sendClientConfirmationEmail: async (...args) => {
      calls.push(args);
      return { success: true };
    },
  });

  await handlers["quote.client-confirmation"]({
    entityId: "quote-1",
    payload: {},
  });

  assert.deepEqual(calls, [["ada@example.com", "Ada", "AP12345678"]]);
  assert.deepEqual(updates, [
    [
      { _id: "quote-1", confirmationEmailSent: { $ne: true } },
      { $set: { confirmationEmailSent: true } },
    ],
  ]);
});

test("admin notification stamps its own flag without changing client delivery", async () => {
  const updates = [];
  const quote = makeQuote({ confirmationEmailSent: false });
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(quote, updates),
    sendAdminNotificationEmail: async (value) => {
      assert.equal(value, quote);
      return { success: true };
    },
  });

  await handlers["quote.admin-notification"]({
    entityId: "quote-1",
    payload: {},
  });

  assert.deepEqual(updates, [
    [
      { _id: "quote-1", adminEmailSent: { $ne: true } },
      { $set: { adminEmailSent: true } },
    ],
  ]);
});

test("stuck reminder stamps its timestamp only after successful mail", async () => {
  const updates = [];
  const quote = makeQuote();
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(quote, updates),
    now: () => NOW,
    sendStuckQuoteReminderEmail: async (quotes) => {
      assert.deepEqual(quotes, [quote]);
      return { success: true };
    },
  });

  await handlers["quote.stuck-reminder"]({
    entityId: "quote-1",
    payload: {},
  });

  assert.deepEqual(updates, [
    [
      {
        _id: "quote-1",
        status: "new",
        stuckReminderSentAt: { $exists: false },
      },
      { $set: { stuckReminderSentAt: NOW } },
    ],
  ]);
});

test("stuck reminder leaves its timestamp untouched when mail fails", async () => {
  const updates = [];
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote(), updates),
    now: () => NOW,
    sendStuckQuoteReminderEmail: async () => ({
      success: false,
      error: "mailbox rejected",
    }),
  });

  await assert.rejects(
    handlers["quote.stuck-reminder"]({
      entityId: "quote-1",
      payload: {},
    }),
    /mailbox rejected/,
  );
  assert.equal(updates.length, 0);
});

test("an unconfigured lead webhook is treated as completed work", async () => {
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote()),
    notifyNewQuote: async () => ({ skipped: true }),
  });

  const result = await handlers["quote.lead-webhook"]({
    entityId: "quote-1",
    payload: {},
  });

  assert.deepEqual(result, { skipped: true });
});

test("approval response uses payload responseVersion and no-ops after the quote changes", async () => {
  const calls = [];
  const quote = makeQuote({ status: "converted", responseVersion: 4 });
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(quote),
    sendQuoteApprovedEmail: async (...args) => {
      calls.push(args);
      return { success: true };
    },
  });

  const stale = await handlers["quote.approved-response"]({
    entityId: "quote-1",
    payload: { responseVersion: 3 },
  });
  assert.deepEqual(stale, { skipped: true });
  assert.equal(calls.length, 0);

  await handlers["quote.approved-response"]({
    entityId: "quote-1",
    payload: { responseVersion: 4 },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].slice(0, 3), [
    "ada@example.com",
    "Ada",
    "AP12345678",
  ]);
});

test("domain event retries reuse the durable job ID as the event ID", async () => {
  const calls = [];
  const handlers = createAutomationHandlers({
    dispatchEvent: async (...args) => {
      calls.push(args);
      return { success: true, targets: 1 };
    },
  });
  const job = {
    _id: "job-17",
    type: "domain.event",
    entityId: "quote-1",
    payload: {
      event: "quote.created",
      data: { quoteId: "quote-1" },
    },
  };

  await handlers["domain.event"](job);
  await handlers["domain.event"](job);

  assert.deepEqual(
    calls.map(([, , options]) => options.eventId),
    ["job-17", "job-17"],
  );
  assert.deepEqual(calls[0].slice(0, 2), [
    "quote.created",
    { quoteId: "quote-1" },
  ]);
});

test("paid quotes skip payment mail and are stamped to stop rechecking", async () => {
  const updates = [];
  let emailCalls = 0;
  const convertedAt = new Date("2026-10-10T08:00:00.000Z");
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(
      makeQuote({ status: "converted", convertedAt }),
      updates,
    ),
    QuotePaymentModel: {
      async exists(filter) {
        assert.deepEqual(filter, {
          quoteId: "quote-1",
          status: "succeeded",
        });
        return { _id: "payment-1" };
      },
    },
    now: () => NOW,
    sendPaymentReminderEmail: async () => {
      emailCalls += 1;
      return { success: true };
    },
  });

  const result = await handlers["quote.payment-reminder"]({
    entityId: "quote-1",
    payload: { convertedAt: convertedAt.toISOString() },
  });

  assert.deepEqual(result, { skipped: true });
  assert.equal(emailCalls, 0);
  assert.deepEqual(updates, [
    [
      {
        _id: "quote-1",
        status: "converted",
        convertedAt,
        paymentReminderSentAt: { $exists: false },
      },
      { $set: { paymentReminderSentAt: NOW } },
    ],
  ]);
});

test("a missing conversion date never qualifies a quote for a payment reminder", async () => {
  let sends = 0;
  const updates = [];
  const handlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote({ status: "converted", convertedAt: null }), updates),
    QuotePaymentModel: { async exists() { return null; } },
    now: () => NOW,
    async sendPaymentReminderEmail() { sends += 1; return { success: true }; },
  });
  const result = await handlers["quote.payment-reminder"]({ entityId: "quote-1", payload: {} });
  assert.deepEqual(result, { skipped: true });
  assert.equal(sends, 0);
  assert.equal(updates.length, 0);
});

test("every mail handler propagates failure without stamping delivery", async (t) => {
  const cases = [
    ["quote.admin-notification", "sendAdminNotificationEmail", {}],
    ["quote.approved-response", "sendQuoteApprovedEmail", { status: "converted", responseVersion: 4 }],
    ["quote.client-follow-up", "sendClientFollowUpEmail", {}],
    ["quote.payment-reminder", "sendPaymentReminderEmail", { status: "converted", convertedAt: new Date("2026-10-10T08:00:00.000Z") }],
    ["booking.satisfaction-follow-up", "sendSatisfactionFollowUpEmail", {}],
    ["ops.daily-digest", "sendDailyDigestEmail", {}],
  ];
  for (const [type, adapter, overrides] of cases) {
    await t.test(type, async () => {
      const updates = [];
      let calls = 0;
      const handlers = createAutomationHandlers({
        QuoteModel: { ...quoteModelFor(makeQuote(overrides), updates), async countDocuments() { return 1; } },
        BookingModel: {
          async findById() {
            return { _id: "booking-1", status: "completed", completedAt: new Date("2026-10-10T08:00:00.000Z"), customerEmail: "ada@example.com" };
          },
          async updateOne(...args) { updates.push(args); },
        },
        ChatLeadModel: { async countDocuments() { return 2; } },
        PaymentModel: { findOne() { return { sort() { return this; }, async lean() { return { processedAt: new Date("2026-10-10T08:00:00.000Z") }; } }; } },
        QuotePaymentModel: { async exists() { return null; }, async aggregate() { return []; } },
        now: () => NOW,
        [adapter]: async () => { calls += 1; return { success: false, error: "provider unavailable" }; },
      });
      await assert.rejects(handlers[type]({ entityId: "quote-1", payload: { responseVersion: 4, paidAt: "2026-10-10T08:00:00.000Z" } }), /provider unavailable/);
      assert.equal(calls, 1);
      assert.equal(updates.length, 0);
    });
  }
});

test("client and unpaid payment follow-ups stamp their own timestamps after success", async (t) => {
  for (const [type, adapter, field, quoteOverrides] of [
    ["quote.client-follow-up", "sendClientFollowUpEmail", "clientFollowUpSentAt", {}],
    ["quote.payment-reminder", "sendPaymentReminderEmail", "paymentReminderSentAt", { status: "converted", convertedAt: new Date("2026-10-10T08:00:00.000Z"), approvedAmount: 125 }],
  ]) {
    await t.test(type, async () => {
      const updates = [];
      const calls = [];
      const handlers = createAutomationHandlers({
        QuoteModel: quoteModelFor(makeQuote(quoteOverrides), updates),
        QuotePaymentModel: { async exists() { return null; } },
        now: () => NOW,
        [adapter]: async (...args) => { calls.push(args); return { success: true }; },
      });
      await handlers[type]({ entityId: "quote-1", payload: {} });
      assert.deepEqual(calls[0].slice(0, 3), ["ada@example.com", "Ada", "AP12345678"]);
      if (quoteOverrides.approvedAmount) assert.equal(calls[0][3], 125);
      assert.equal(updates.length, 1);
      assert.deepEqual(updates[0][1], { $set: { [field]: NOW } });
    });
  }
});

test("satisfaction follow-up reloads the linked user and stamps only after delivery", async () => {
  const updates = [];
  const completedAt = new Date("2026-10-10T08:00:00.000Z");
  const handlers = createAutomationHandlers({
    PaymentModel: { findOne() { return { sort() { return this; }, async lean() { return { processedAt: completedAt }; } }; } },
    BookingModel: {
      findById(id) {
        assert.equal(id, "booking-1");
        return {
          populate(path, fields) { assert.equal(path, "userId"); assert.equal(fields, "email firstName"); return this; },
          async lean() { return { _id: id, status: "completed", completedAt, quoteReference: "AP12345678", userId: { email: "ada@example.com", firstName: "Ada" } }; },
        };
      },
      async updateOne(...args) { updates.push(args); },
    },
    now: () => NOW,
    async sendSatisfactionFollowUpEmail(...args) {
      assert.deepEqual(args, ["ada@example.com", "Ada", "AP12345678"]);
      assert.equal(updates.length, 0);
      return { success: true };
    },
  });
  await handlers["booking.satisfaction-follow-up"]({ entityId: "booking-1", payload: { completedAt: completedAt.toISOString(), paidAt: completedAt.toISOString() } });
  assert.deepEqual(updates, [[
    { _id: "booking-1", status: "completed", completedAt, satisfactionEmailSentAt: { $exists: false } },
    { $set: { satisfactionEmailSentAt: NOW } },
  ]]);
});

test("review follow-up waits 48 hours after both payment and completion and skips ineligible jobs", async (t) => {
  const old = new Date(NOW.getTime() - 72 * 60 * 60 * 1000);
  const boundary = new Date(NOW.getTime() - 48 * 60 * 60 * 1000);
  const recent = new Date(boundary.getTime() + 1);
  for (const scenario of [
    { name: "unpaid", payment: null, sends: 0 },
    { name: "payment date missing", payment: {}, sends: 0 },
    { name: "payment 1ms too recent", payment: { processedAt: recent }, sends: 0 },
    { name: "payment exactly 48h ago", payment: { processedAt: boundary }, sends: 1 },
    { name: "completion 1ms too recent", payment: { processedAt: old }, booking: { completedAt: recent }, sends: 0 },
    { name: "completion exactly 48h ago", payment: { processedAt: old }, booking: { completedAt: boundary }, sends: 1 },
    { name: "refunded", payment: { processedAt: old }, booking: { paymentStatus: "refunded" }, sends: 0 },
    { name: "cancelled", payment: { processedAt: old }, booking: { status: "cancelled" }, sends: 0 },
    { name: "already sent", payment: { processedAt: old }, booking: { satisfactionEmailSentAt: old }, sends: 0 },
    { name: "guest quote payment", payment: null, quotePayment: { processedAt: boundary }, booking: { quoteId: "quote-1" }, sends: 1 },
    { name: "guest paid too recently", payment: null, quotePayment: { processedAt: recent }, booking: { quoteId: "quote-1" }, sends: 0 },
    { name: "legacy completion-only job", payment: { processedAt: old }, payload: {}, sends: 0 },
    { name: "superseded payment job", payment: { processedAt: boundary }, payload: { paidAt: old.toISOString() }, sends: 0 },
    { name: "job completed again", payment: { processedAt: old }, payload: { paidAt: old.toISOString(), completedAt: boundary.toISOString() }, sends: 0 },
  ]) {
    await t.test(scenario.name, async () => {
      let sends = 0;
      let stamps = 0;
      const paymentModel = (payment, key) => ({
        findOne(filter) {
          assert.equal(filter.status, "succeeded");
          assert.equal(filter[key], key === "bookingId" ? "booking-1" : "quote-1");
          return { sort() { return this; }, async lean() { return payment; } };
        },
      });
      const booking = { _id: "booking-1", status: "completed", completedAt: old, customerEmail: "ada@example.com", ...scenario.booking };
      const handlers = createAutomationHandlers({
        BookingModel: { async findById() { return booking; }, async updateOne() { stamps += 1; } },
        PaymentModel: paymentModel(scenario.payment, "bookingId"),
        QuotePaymentModel: paymentModel(scenario.quotePayment, "quoteId"),
        now: () => NOW,
        async sendSatisfactionFollowUpEmail() { sends += 1; return { success: true }; },
      });
      const paidAt = scenario.quotePayment?.processedAt || scenario.payment?.processedAt || old;
      await handlers["booking.satisfaction-follow-up"]({ entityId: "booking-1", payload: scenario.payload || { paidAt: paidAt.toISOString() } });
      assert.equal(sends, scenario.sends);
      assert.equal(stamps, scenario.sends);
    });
  }
});

test("deleted quotes and reviewed spam produce no outbound work", async () => {
  const noSend = async () => { assert.fail("ineligible records must not send"); };
  const deletedHandlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote({ isDeleted: true, suspectedSpam: true })),
    sendClientConfirmationEmail: noSend, sendAdminNotificationEmail: noSend,
    sendQuoteApprovedEmail: noSend, sendStuckQuoteReminderEmail: noSend,
    sendClientFollowUpEmail: noSend, sendPaymentReminderEmail: noSend,
    notifyNewQuote: noSend, notifyAdminAlert: noSend,
  });
  for (const type of Object.keys(deletedHandlers).filter((value) => value.startsWith("quote."))) {
    assert.deepEqual(await deletedHandlers[type]({ entityId: "quote-1", payload: {} }), { skipped: true });
  }
  const reviewedHandlers = createAutomationHandlers({
    QuoteModel: quoteModelFor(makeQuote({ suspectedSpam: true, suspicionReviewedAt: NOW })),
    ChatLeadModel: { async findById() { return { suspectedSpam: true, suspicionReviewedAt: NOW }; } },
    notifyAdminAlert: noSend, notifyHotChatLead: noSend,
  });
  for (const type of ["quote.spam-alert", "chat-lead.spam-alert", "chat-lead.hot-webhook"]) {
    assert.deepEqual(await reviewedHandlers[type]({ entityId: "quote-1", payload: {} }), { skipped: true });
  }
});

test("outbound webhook failures remain retryable handler errors", async (t) => {
  for (const type of ["quote.lead-webhook", "quote.spam-alert", "chat-lead.hot-webhook", "chat-lead.spam-alert", "domain.event"]) {
    await t.test(type, async () => {
      const fail = async () => ({ success: false, error: "webhook unavailable" });
      const handlers = createAutomationHandlers({
        QuoteModel: quoteModelFor(makeQuote({ suspectedSpam: true })),
        ChatLeadModel: { async findById() { return { phone: "07123456789", postcode: "SS1 2BB", suspectedSpam: true }; } },
        notifyNewQuote: fail, notifyAdminAlert: fail, notifyHotChatLead: fail, dispatchEvent: fail,
      });
      await assert.rejects(handlers[type]({ _id: "job-1", entityId: "quote-1", payload: { event: "quote.created" } }), /webhook unavailable/);
    });
  }
});

test("approval initializes SMTP lazily and retries a transient transport failure", async (t) => {
  const settings = { EMAIL_PROVIDER: "smtp", SMTP_HOST: "smtp.example.test", SMTP_USER: "test-user", SMTP_PASS: "test-password" };
  const previous = Object.fromEntries(Object.keys(settings).map((key) => [key, process.env[key]]));
  Object.assign(process.env, settings);
  t.after(() => { for (const [key, value] of Object.entries(previous)) restoreEnv(key, value); });
  const sent = [];
  const transport = t.mock.method(nodemailer, "createTransport", () => ({
    async sendMail(message) {
      sent.push(message);
      if (sent.length === 1) throw new Error("temporary transport failure");
    },
  }));
  const { sendQuoteApprovedEmail } = await import("../utils/emailService.js?task2-smtp");
  assert.equal(transport.mock.callCount(), 0);
  assert.deepEqual(await sendQuoteApprovedEmail("ada@example.com", "Ada", "AP12345678"), { success: true });
  assert.equal(transport.mock.callCount(), 1);
  assert.equal(sent.length, 2);
  assert.ok(sent.every((message) => message.to === "ada@example.com" && message.text.includes("AP12345678")));
  assert.ok(sent.every((message) => message.attachments[0].cid === "apex-five-logo@apexfivecleaning.co.uk"));
});

test("approval initializes SendGrid and returns failure after bounded retries", async (t) => {
  const settings = { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "test-key" };
  const previous = Object.fromEntries(Object.keys(settings).map((key) => [key, process.env[key]]));
  Object.assign(process.env, settings);
  t.after(() => { for (const [key, value] of Object.entries(previous)) restoreEnv(key, value); });
  const initialize = t.mock.method(sgMail, "setApiKey", () => {});
  const send = t.mock.method(sgMail, "send", async () => { throw new Error("provider unavailable"); });
  const { sendQuoteApprovedEmail } = await import("../utils/emailService.js?task2-sendgrid");
  assert.deepEqual(await sendQuoteApprovedEmail("ada@example.com", "Ada", "AP12345678"), { success: false, error: "provider unavailable" });
  assert.equal(initialize.mock.callCount(), 1);
  assert.equal(send.mock.callCount(), 3);
  assert.equal(send.mock.calls[0].arguments[0].attachments[0].content_id, "apex-five-logo@apexfivecleaning.co.uk");
});

test("dispatchEvent returns skipped when no event targets are configured", async () => {
  const previous = process.env.EVENT_WEBHOOK_URLS;
  delete process.env.EVENT_WEBHOOK_URLS;

  try {
    assert.deepEqual(await dispatchEvent("quote.created", {}), {
      skipped: true,
    });
  } finally {
    restoreEnv("EVENT_WEBHOOK_URLS", previous);
  }
});

test("dispatchEvent awaits every target and preserves a supplied event ID", async () => {
  const received = [];
  const previous = process.env.EVENT_WEBHOOK_URLS;
  const originalPost = axios.post;
  axios.post = async (url, body) => {
    if (url.endsWith("/two")) {
      await new Promise((resolve) => setImmediate(resolve));
    }
    received.push({ url, body: JSON.parse(body) });
  };
  process.env.EVENT_WEBHOOK_URLS = [
    "https://one.example.test/one",
    "https://two.example.test/two",
  ].join(",");

  try {
    const result = await dispatchEvent(
      "quote.created",
      { quoteId: "quote-1" },
      { eventId: "stable-job-id" },
    );

    assert.deepEqual(result, { success: true, targets: 2 });
    assert.equal(received.length, 2);
    assert.deepEqual(
      received.map(({ url }) => url).sort(),
      ["https://one.example.test/one", "https://two.example.test/two"],
    );
    assert.ok(received.every(({ body }) => body.id === "stable-job-id"));
  } finally {
    axios.post = originalPost;
    restoreEnv("EVENT_WEBHOOK_URLS", previous);
  }
});

test("dispatchEvent waits for all targets and reports any target failure", async () => {
  const received = [];
  const previous = process.env.EVENT_WEBHOOK_URLS;
  const originalPost = axios.post;
  axios.post = async (url) => {
    received.push(url);
    if (url.endsWith("/fail")) {
      throw new Error("Request failed with status code 503");
    }
  };
  process.env.EVENT_WEBHOOK_URLS = [
    "https://fail.example.test/fail",
    "https://ok.example.test/ok",
  ].join(",");

  try {
    const result = await dispatchEvent("quote.created", {}, { eventId: "job-1" });

    assert.equal(result.success, false);
    assert.match(result.error, /503/);
    assert.deepEqual(received.sort(), [
      "https://fail.example.test/fail",
      "https://ok.example.test/ok",
    ]);
  } finally {
    axios.post = originalPost;
    restoreEnv("EVENT_WEBHOOK_URLS", previous);
  }
});

test("the compatibility event wrapper queues work without waiting and preserves signing", async (t) => {
  const previous = process.env.EVENT_WEBHOOK_URLS;
  const previousSecret = process.env.EVENT_WEBHOOK_SECRET;
  process.env.EVENT_WEBHOOK_URLS = "https://events.example.test";
  process.env.EVENT_WEBHOOK_SECRET = "test-signing-secret";
  t.after(() => { restoreEnv("EVENT_WEBHOOK_URLS", previous); restoreEnv("EVENT_WEBHOOK_SECRET", previousSecret); });
  const calls = [];
  t.mock.method(axios, "post", async (...args) => { calls.push(args); });
  const result = emitEvent("quote.created", { quoteId: "quote-1", token: "private-token" });
  assert.deepEqual(result, { queued: true, targets: 1 });
  assert.equal(calls.length, 0);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls.length, 1);
  const [, body, options] = calls[0];
  assert.equal(verifyEventSignature(body, options.headers["X-Apex-Signature"]), true);
  assert.deepEqual(JSON.parse(body).data, { quoteId: "quote-1" });
});
