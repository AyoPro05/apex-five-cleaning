import test from "node:test";
import assert from "node:assert/strict";

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
  assert.match(html, /📘 Facebook/);
  assert.match(html, /📸 Instagram/);
  assert.match(html, /🎵 TikTok/);
});

test("email logo uses HTTPS www URL with no redirect", () => {
  const { html } = getClientConfirmationTemplate("Ada", "AP12345678");

  const logoMatch = html.match(/<img[^>]*class="email-logo"[^>]*>/);
  assert.ok(logoMatch, "expected logo image tag in email header");

  const srcMatch = logoMatch[0].match(/src="([^"]+)"/);
  assert.ok(srcMatch, "expected src attribute on logo image");

  const logoUrl = srcMatch[1];
  assert.ok(
    logoUrl.startsWith("https://www."),
    `logo URL should be HTTPS with www (got: ${logoUrl})`,
  );
  assert.ok(
    !logoUrl.includes("localhost"),
    `logo URL should never point to localhost (got: ${logoUrl})`,
  );
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

    // The inline support contact block should only appear once (in the footer)
    // We match the HTML usage (class="email-contact-stack"), not the CSS definition
    const contactStackOccurrences = (
      html.match(/class="email-contact-stack"/g) || []
    ).length;
    assert.ok(
      contactStackOccurrences === 1,
      `expected contact block to appear once in footer (got ${contactStackOccurrences})`,
    );
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
