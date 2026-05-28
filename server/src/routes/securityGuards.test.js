import test from "node:test";
import assert from "node:assert/strict";

import bookingsRouter, { resolveBookingDiscount } from "./bookings.js";
import {
  canRefundPayment,
  validateStoredPaymentIntent,
} from "./payments.js";

test("booking discounts are server-owned and ignore client-supplied discounts", () => {
  assert.equal(
    resolveBookingDiscount({ role: "member" }, 99),
    10,
    "members should receive only the server-defined member discount",
  );
  assert.equal(
    resolveBookingDiscount({ role: "customer" }, 50),
    0,
    "non-members should not receive a client-supplied discount",
  );
});

test("payment confirmation rejects a Stripe intent that does not belong to the stored payment", () => {
  const payment = {
    _id: "payment_1",
    stripePaymentIntentId: "pi_expected",
    userId: "user_1",
    bookingId: "booking_1",
    amount: 120.5,
    currency: "GBP",
  };

  assert.equal(
    validateStoredPaymentIntent(payment, {
      id: "pi_other",
      amount: 12050,
      currency: "gbp",
      metadata: { userId: "user_1", bookingId: "booking_1" },
    }).ok,
    false,
  );

  assert.equal(
    validateStoredPaymentIntent(payment, {
      id: "pi_expected",
      amount: 12050,
      currency: "gbp",
      metadata: { userId: "user_1", bookingId: "booking_1" },
    }).ok,
    true,
  );
});

test("refund requests are admin-only", () => {
  assert.equal(canRefundPayment({ role: "member" }), false);
  assert.equal(canRefundPayment({ role: "admin" }), true);
});

test("booking stats route is registered before generic booking id route", () => {
  const paths = bookingsRouter.stack
    .map((layer) => layer.route?.path)
    .filter(Boolean);

  assert.ok(
    paths.indexOf("/stats/overview") < paths.indexOf("/:id"),
    `expected /stats/overview before /:id, got ${paths.join(", ")}`,
  );
});
