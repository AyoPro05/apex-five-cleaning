import test from "node:test";
import assert from "node:assert/strict";
import { buildCorsOptions, getCorsOrigins } from "./corsConfig.js";

test("buildCorsOptions allows the idempotency header for preflight requests", () => {
  const options = buildCorsOptions({
    env: {
      CLIENT_URL: "https://www.example.com",
      VERCEL_URL: "preview.example.vercel.app",
      ADDITIONAL_CORS_ORIGINS: "https://app.example.com",
    },
  });

  assert.ok(options.allowedHeaders.includes("X-Idempotency-Key"));
});

test("getCorsOrigins includes the production frontend origins", () => {
  const origins = getCorsOrigins({
    env: {
      CLIENT_URL: "https://www.example.com",
      VERCEL_URL: "preview.example.vercel.app",
      ADDITIONAL_CORS_ORIGINS: "https://app.example.com",
    },
  });

  assert.ok(origins.includes("https://www.apexfivecleaning.co.uk"));
  assert.ok(origins.includes("https://apexfivecleaning.co.uk"));
  assert.ok(origins.includes("https://www.example.com"));
  assert.ok(origins.includes("https://app.example.com"));
});
