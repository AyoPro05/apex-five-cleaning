import test from "node:test";
import assert from "node:assert/strict";

import { getClientConfirmationTemplate } from "./emailService.js";

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
