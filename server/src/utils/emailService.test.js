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
