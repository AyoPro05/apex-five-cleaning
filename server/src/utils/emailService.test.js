import test from "node:test";
import assert from "node:assert/strict";
import nodemailer from "nodemailer";
import User from "../../models/User.js";
import * as emailService from "./emailService.js";

import {
  getClientConfirmationTemplate,
  getQuoteApprovedTemplate,
  getVerificationEmailTemplate,
  getVerificationSuccessTemplate,
  getResendVerificationTemplate,
} from "./emailService.js";

test("email footer includes official social profiles", () => {
  const { html } = getClientConfirmationTemplate("Ada", "AP12345678");

  assert.match(
    html,
    /https:\/\/www\.facebook\.com\/people\/Apex-Five-Cleaning-Services\/61590339615849\//,
  );
  assert.match(html, /https:\/\/www\.instagram\.com\/apex\.fivecleaning\//);
  assert.match(html, /https:\/\/www\.tiktok\.com\/@apex_fivecleaningservice/);
  assert.match(html, />Facebook<\/a>/);
  assert.match(html, />Instagram<\/a>/);
  assert.match(html, />TikTok<\/a>/);
});

test("email logo is embedded rather than fetched from the website", () => {
  const { html } = getClientConfirmationTemplate("Ada", "AP12345678");

  const logoMatch = html.match(/<img[^>]*class="email-logo"[^>]*>/);
  assert.ok(logoMatch, "expected logo image tag in email header");

  const srcMatch = logoMatch[0].match(/src="([^"]+)"/);
  assert.ok(srcMatch, "expected src attribute on logo image");

  const logoUrl = srcMatch[1];
  assert.equal(logoUrl, "cid:apex-five-logo@apexfivecleaning.co.uk");
  assert.ok(
    !logoUrl.includes("localhost"),
    `logo URL should never point to localhost (got: ${logoUrl})`,
  );
});

test("SMTP emails contain a matching inline PNG attachment in the generated MIME", async () => {
  const template = getClientConfirmationTemplate("Ada", "AP12345678");
  const message = emailService.withEmailLogo({ ...template, to: "ada@example.com", from: "info@apexfivecleaning.co.uk" }, "smtp");
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true });
  const { message: mime } = await transport.sendMail(message);
  const source = mime.toString();
  assert.match(source, /Content-ID: <apex-five-logo@apexfivecleaning.co.uk>/);
  assert.match(source, /Content-Type: image\/png/);
  assert.match(source, /Content-Disposition: inline/);
  assert.equal(message.attachments[0].content.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
});

test("SendGrid receives the same PNG as an inline base64 attachment", () => {
  const template = getClientConfirmationTemplate("Ada", "AP12345678");
  const { attachments } = emailService.withEmailLogo(template, "sendgrid");
  assert.equal(attachments[0].content_id, "apex-five-logo@apexfivecleaning.co.uk");
  assert.equal(attachments[0].disposition, "inline");
  assert.equal(attachments[0].type, "image/png");
  assert.equal(Buffer.from(attachments[0].content, "base64").subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
});

test("Google review email invites feedback from every customer and includes a plain text link", (t) => {
  const previous = process.env.GOOGLE_REVIEW_URL;
  process.env.GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=example";
  t.after(() => {
    if (previous === undefined) delete process.env.GOOGLE_REVIEW_URL;
    else process.env.GOOGLE_REVIEW_URL = previous;
  });
  const { html, text } = emailService.getSatisfactionFollowUpTemplate("Ada <script>", "AP12345678");
  assert.match(html, /Ada &lt;script&gt;/);
  assert.match(html, /Leave a Google review/);
  assert.doesNotMatch(html, /If you were happy|★★★★★/);
  assert.match(text, /https:\/\//);
  assert.match(text, /AP12345678/);
  assert.ok(html.includes(process.env.GOOGLE_REVIEW_URL));
  assert.ok(text.includes(process.env.GOOGLE_REVIEW_URL));
});

test("review emails use the Google link supplied by the business owner by default", (t) => {
  const previous = process.env.GOOGLE_REVIEW_URL;
  delete process.env.GOOGLE_REVIEW_URL;
  t.after(() => {
    if (previous !== undefined) process.env.GOOGLE_REVIEW_URL = previous;
  });
  const { html, text } = emailService.getSatisfactionFollowUpTemplate("Ada", "AP12345678");
  const reviewUrl = "https://share.google/VHCntVtmEIBIasSi4";
  assert.ok(html.includes(`href="${reviewUrl}"`));
  assert.ok(text.includes(reviewUrl));
});

test("an explicitly blank Google review URL disables review requests", async (t) => {
  const previous = process.env.GOOGLE_REVIEW_URL;
  process.env.GOOGLE_REVIEW_URL = "  ";
  t.after(() => {
    if (previous === undefined) delete process.env.GOOGLE_REVIEW_URL;
    else process.env.GOOGLE_REVIEW_URL = previous;
  });
  const result = await emailService.sendSatisfactionFollowUpEmail("ada@example.com", "Ada", "AP12345678");
  assert.equal(result.success, false);
  assert.match(result.error, /GOOGLE_REVIEW_URL/);
});

test("email logo tag uses valid height attribute for email clients", () => {
  const { html } = getClientConfirmationTemplate("Ada", "AP12345678");

  const logoMatch = html.match(/<img[^>]*class="email-logo"[^>]*>/);
  assert.ok(logoMatch, "expected logo image tag in email header");

  // height="auto" is invalid for email clients (Outlook uses Word engine);
  // height must be a number or omitted entirely
  assert.ok(
    !/height="auto"/i.test(logoMatch[0]),
    'logo img should not use height="auto" (invalid in email clients)',
  );
});

test("customer emails have contact details only in footer (no duplicates)", () => {
  const templates = [
    getClientConfirmationTemplate("Ada", "AP12345678"),
    getQuoteApprovedTemplate("Ada", "AP12345678"),
    getVerificationEmailTemplate("Ada", "https://example.com/verify?token=abc"),
    getVerificationSuccessTemplate("Ada"),
    getResendVerificationTemplate("Ada", "https://example.com/verify?token=abc"),
  ];

  for (const { html } of templates) {
    const phoneOccurrences = (html.match(/020 3535 6331/g) || []).length;
    assert.ok(
      phoneOccurrences === 1,
      `expected phone number to appear once in footer (got ${phoneOccurrences})`,
    );

    // Match the HTML footer element rather than its CSS definition.
    const footerOccurrences = (
      html.match(/class="email-footer"/g) || []
    ).length;
    assert.ok(
      footerOccurrences === 1,
      `expected one contact footer (got ${footerOccurrences})`,
    );
  }
});

test("every automated email has one standard footer with no repeated company contact details", async (t) => {
  const settings = {
    EMAIL_PROVIDER: "smtp", SMTP_HOST: "smtp.example.test", SMTP_USER: "test", SMTP_PASS: "test",
    GOOGLE_REVIEW_URL: "https://share.google/VHCntVtmEIBIasSi4",
  };
  const previous = Object.fromEntries(Object.keys(settings).map((key) => [key, process.env[key]]));
  Object.assign(process.env, settings);
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const messages = [];
  t.mock.method(nodemailer, "createTransport", () => ({ async sendMail(message) { messages.push(message); } }));
  t.mock.method(User, "updateOne", async () => ({ acknowledged: true }));
  const mail = await import("./emailService.js?contact-audit");
  const recipient = "ada@example.com";
  const quote = { _id: "quote-1", reference: "AP12345678", firstName: "Ada", lastName: "Lovelace", email: recipient, phone: "07123456789", address: "10 Example Road", createdAt: new Date("2026-10-20T10:00:00Z") };
  const cases = [
    ["sendClientConfirmationEmail", [recipient, "Ada", quote.reference]],
    ["sendQuoteApprovedEmail", [recipient, "Ada", quote.reference]],
    ["sendContactEnquiryEmail", [{ name: "Ada", email: recipient, subject: "quote", message: "Please contact me about cleaning." }]],
    ["sendAdminNotificationEmail", [quote]],
    ["sendVerificationEmail", [recipient, "Ada", "test-token"]],
    ["sendVerificationSuccessEmail", [recipient, "Ada"]],
    ["sendResendVerificationEmail", [recipient, "Ada", "test-token"]],
    ["sendStuckQuoteReminderEmail", [[quote]]],
    ["sendDailyDigestEmail", [{}]],
    ["sendSatisfactionFollowUpEmail", [recipient, "Ada", quote.reference]],
    ["sendClientFollowUpEmail", [recipient, "Ada", quote.reference]],
    ["sendPaymentReminderEmail", [recipient, "Ada", quote.reference, 120]],
    ["sendPaymentConfirmationEmail", [{ toEmail: recipient, firstName: "Ada", amount: 120, reference: quote.reference, paymentId: "payment-1" }]],
    ["sendPasswordResetEmail", [recipient, "Ada", "test-token"]],
  ];
  for (const [name, args] of cases) {
    await t.test(name, async () => {
      const before = messages.length;
      const result = await mail[name](...args);
      assert.equal(result.success, true);
      assert.equal(messages.length, before + 1);
      const { html, text = "" } = messages.at(-1);
      const visible = html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      for (const address of ["info@apexfivecleaning.co.uk", "020 3535 6331", "07343 118167", "Tylers House, Tylers Avenue", "Southend-on-Sea, England, SS1 2BB"]) {
        assert.equal(visible.split(address).length - 1, 1, `${name}: ${address} must appear once`);
        assert.ok(text.split(address).length - 1 <= 1, `${name}: plain text must not repeat ${address}`);
      }
      assert.equal((html.match(/class="email-footer"/g) || []).length, 1);
      assert.equal((html.match(/href="mailto:info@apexfivecleaning\.co\.uk(?:\?[^"]*)?"/g) || []).length, 1);
      assert.equal((visible.match(/(?<![@\w])(?:www\.)?apexfivecleaning\.co\.uk\b/g) || []).length, 1, `${name}: website address must appear once`);
    });
  }
});

test("approved quote email includes the amount and safely escaped customer message", () => {
  const { html, text } = getQuoteApprovedTemplate("Ada", "AP12345678", {
    approvedAmount: 125.5,
    customerMessage: "Please review <script>alert(1)</script> & reply.",
  });

  assert.match(html, /£125\.50/);
  assert.match(text, /£125\.50/);
  assert.match(html, /Please review &lt;script&gt;alert\(1\)&lt;\/script&gt; &amp; reply\./);
  assert.match(text, /Please review <script>alert\(1\)<\/script> & reply\./);
  assert.doesNotMatch(html, /<script>/);
});
