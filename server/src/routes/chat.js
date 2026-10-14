import express from "express";
import Joi from "joi";
import ChatLead from "../models/ChatLead.js";
import { buildAssistantReply } from "../utils/chatAssistant.js";
import {
  chatLeadRateLimiter,
  chatMessageRateLimiter,
} from "../middleware/rateLimiter.js";
import { sanitizeEmail, sanitizePhoneNumber } from "../utils/validation.js";
import { assessSubmissionRisk } from "../utils/suspiciousActivity.js";
import defaultQueue from "../services/automationQueue.js";
import { drainAutomationJobs } from "../services/automationCycle.js";
import { queueBackgroundWork } from "../services/backgroundWork.js";

const router = express.Router();

const messageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(800).required(),
  conversationId: Joi.string().trim().max(80).optional().allow(""),
});

const leadSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email({ tlds: { allow: false } }).optional().allow(""),
  phone: Joi.string().trim().max(40).optional().allow(""),
  postcode: Joi.string().trim().max(12).optional().allow(""),
  serviceType: Joi.string().trim().max(80).optional().allow(""),
  message: Joi.string().trim().max(4000).optional().allow(""),
  conversationId: Joi.string().trim().max(80).optional().allow(""),
})
  .custom((value, helpers) => {
    if (!value.email && !value.phone) {
      return helpers.error("any.custom", {
        message: "Provide at least an email or phone number.",
      });
    }
    return value;
  })
  .messages({
    "any.custom": "{{#message}}",
  });

router.post("/message", chatMessageRateLimiter, async (req, res) => {
  const { error, value } = messageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0]?.message || "Invalid chat message payload.",
    });
  }

  const response = buildAssistantReply(value.message);
  return res.json({
    success: true,
    response,
  });
});

export function createChatLeadHandler({
  ChatLeadModel = ChatLead,
  queue = defaultQueue,
  assessSubmissionRisk: assessRisk = assessSubmissionRisk,
  queueBackgroundWork: scheduleBackground = queueBackgroundWork,
  drainAutomationJobs: drain = drainAutomationJobs,
  logger = console,
} = {}) {
 return async (req, res) => {
  const { error, value } = leadSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0]?.message || "Invalid lead details.",
    });
  }

  try {
    const ipAddress = req.ip || req.connection?.remoteAddress || "";
    const email = value.email ? sanitizeEmail(value.email) : "";
    const phone = value.phone ? sanitizePhoneNumber(value.phone) : "";
    const postcode = value.postcode ? value.postcode.trim().toUpperCase() : "";

    const risk = await assessRisk({
      type: "chat_lead",
      ipAddress,
      email,
      phone,
      postcode,
    });

    const lead = await ChatLeadModel.create({
      name: value.name,
      email,
      phone,
      postcode,
      serviceType: value.serviceType || "",
      message: value.message || "",
      conversationId: value.conversationId || "",
      source: "chat-widget",
      ipAddress,
      userAgent: req.get("user-agent") || "",
      suspectedSpam: risk.suspectedSpam,
      suspicionReasons: risk.suspicionReasons,
    });

    const leadId = String(lead._id);
    const jobs = [
      { type: "chat-lead.hot-webhook", dedupeKey: `chat-lead.hot-webhook:${leadId}` },
      { type: "domain.event", dedupeKey: `domain.event:chat-lead.created:${leadId}`, payload: { event: "chat_lead.created", data: { leadId } } },
      ...(lead.suspectedSpam ? [{ type: "chat-lead.spam-alert", dedupeKey: `chat-lead.spam-alert:${leadId}` }] : []),
    ];
    const outcomes = await Promise.allSettled(jobs.map((job) => queue.enqueue({ ...job, entityType: "ChatLead", entityId: leadId })));
    const failure = outcomes.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;

    res.status(201).json({
      success: true,
      leadId,
      message: "Thanks - our team will follow up shortly.",
    });
    scheduleBackground(() => drain({ limit: 8 }), {
      onError: (error) => logger.error("Chat lead automation drain failed:", error),
    });
    return;
  } catch (saveErr) {
    logger.error("Chat lead save failed:", saveErr);
    return res.status(500).json({
      success: false,
      error: "We could not save your details right now. Please try again.",
    });
  }
 };
}

router.post("/lead", chatLeadRateLimiter, createChatLeadHandler());

export default router;
