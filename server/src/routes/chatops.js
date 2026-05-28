/**
 * CHATOPS ROUTES
 * Mobile-friendly admin commands from Slack slash commands, Discord interactions,
 * or any HTTP client with CHATOPS_SECRET.
 *
 * Slack: POST /api/chatops/slack  (configure slash command → this URL)
 * Discord: POST /api/chatops/discord (Interactions endpoint URL)
 * Generic: POST /api/chatops/command { "text": "quote AP12345678 contacted" }
 *          Header: X-ChatOps-Secret: <CHATOPS_SECRET>
 */

import express from "express";
import {
  executeChatOpsCommand,
  verifyChatOpsSecret,
  verifySlackSignature,
  verifyDiscordInteraction,
  parseDiscordInteraction,
} from "../utils/chatOpsService.js";
import { chatOpsRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const captureRawUrlencoded = express.urlencoded({
  extended: true,
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
});

router.post("/command", chatOpsRateLimiter, express.json(), async (req, res) => {
  const secret = req.get("X-ChatOps-Secret") || req.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!verifyChatOpsSecret(secret)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const text = req.body?.text || req.body?.command || "";
  try {
    const response = await executeChatOpsCommand(text);
    return res.json({ success: true, ...response });
  } catch (error) {
    console.error("ChatOps command failed:", error);
    return res.status(500).json({
      success: false,
      error: "Command failed",
      text: "Something went wrong running that command.",
    });
  }
});

router.post("/slack", chatOpsRateLimiter, captureRawUrlencoded, async (req, res) => {
  const signingSecret = process.env.SLACK_SIGNING_SECRET?.trim();
  if (!signingSecret) {
    return res.status(503).json({ text: "Slack ChatOps is not configured." });
  }

  const rawBody = req.rawBody ? req.rawBody.toString("utf8") : new URLSearchParams(req.body).toString();
  const timestamp = req.get("X-Slack-Request-Timestamp");
  const signature = req.get("X-Slack-Signature");

  if (!verifySlackSignature(rawBody, timestamp, signature)) {
    return res.status(401).json({ text: "Invalid Slack signature." });
  }

  const text = req.body?.text || "";
  const command = String(req.body?.command || "").replace(/^\//, "");
  const combined = command && !text.toLowerCase().startsWith(command.toLowerCase())
    ? `${command} ${text}`.trim()
    : text || command;

  try {
    const response = await executeChatOpsCommand(combined);
    return res.json(response);
  } catch (error) {
    console.error("Slack ChatOps failed:", error);
    return res.json({ response_type: "ephemeral", text: "Command failed. Try again or use the admin dashboard." });
  }
});

router.post("/discord", chatOpsRateLimiter, express.raw({ type: "application/json" }), async (req, res) => {
  const publicKey = process.env.DISCORD_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return res.status(503).json({ error: "Discord ChatOps is not configured." });
  }

  const signature = req.get("X-Signature-Ed25519");
  const timestamp = req.get("X-Signature-Timestamp");
  const rawBody = req.body?.toString("utf8") || "";

  if (!verifyDiscordInteraction(rawBody, signature, timestamp)) {
    return res.status(401).json({ error: "Invalid Discord signature." });
  }

  let interaction;
  try {
    interaction = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (interaction.type === 1) {
    return res.json({ type: 1 });
  }

  const parsed = parseDiscordInteraction(interaction);
  if (parsed.kind === "ping") {
    return res.json({ type: 1 });
  }

  if (parsed.kind !== "command") {
    return res.json({
      type: 4,
      data: { content: "Unsupported interaction.", flags: 64 },
    });
  }

  const text = [parsed.command, ...(parsed.args || [])].join(" ").trim();

  try {
    const result = await executeChatOpsCommand(text);
    return res.json({
      type: 4,
      data: {
        content: result.text,
        flags: result.response_type === "ephemeral" ? 64 : 0,
      },
    });
  } catch (error) {
    console.error("Discord ChatOps failed:", error);
    return res.json({
      type: 4,
      data: { content: "Command failed. Try again or use the admin dashboard.", flags: 64 },
    });
  }
});

export default router;
