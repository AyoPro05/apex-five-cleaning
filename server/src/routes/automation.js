import { timingSafeEqual } from "node:crypto";
import express from "express";
import { runAutomationCycle } from "../services/automationCycle.js";
import { captureServerException } from "../utils/sentry.js";

export function isCronRequestAuthorized(headers, secret) {
  const authorization = headers?.authorization;
  if (typeof secret !== "string" || !secret || typeof authorization !== "string") return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createAutomationRunHandler({
  secret = () => process.env.CRON_SECRET,
  runCycle = runAutomationCycle,
  captureException = captureServerException,
} = {}) {
  return async (req, res) => {
    const configuredSecret = secret();
    if (!configuredSecret) return res.status(503).json({ success: false, error: "Automation is not configured" });
    if (!isCronRequestAuthorized(req.headers, configuredSecret)) return res.status(401).json({ success: false, error: "Unauthorized" });
    try {
      const result = await runCycle({ trigger: "cron" });
      return res.json(result);
    } catch {
      captureException(new Error("Cron automation failed"), { tags: { source: "cron" } });
      return res.status(500).json({ success: false, error: "Automation run failed" });
    }
  };
}

const router = express.Router();
router.get("/run", createAutomationRunHandler());
export default router;
