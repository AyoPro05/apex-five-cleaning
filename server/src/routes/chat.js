import express from "express";
import Joi from "joi";
import ChatLead from "../models/ChatLead.js";
import { buildAssistantReply } from "../utils/chatAssistant.js";
import {
  chatLeadRateLimiter,
  chatMessageRateLimiter,
} from "../middleware/rateLimiter.js";
import { sanitizeEmail, sanitizePhoneNumber } from "../utils/validation.js";
import { notifyHotChatLead } from "../utils/leadWebhook.js";
import { idempotency } from "../middleware/idempotency.js";
import { emitEvent } from "../utils/eventBus.js";
import { assessSubmissionRisk } from "../utils/suspiciousActivity.js";
import { notifyAdminAlert } from "../utils/leadWebhook.js";

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

router.post("/lead", chatLeadRateLimiter, idempotency(), async (req, res) => {
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

    const risk = await assessSubmissionRisk({
      type: "chat_lead",
      ipAddress,
      email,
      phone,
      postcode,
    });

    const lead = await ChatLead.create({
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

    setImmediate(() => {
      notifyHotChatLead({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        postcode: lead.postcode,
        serviceType: lead.serviceType,
        message: lead.message,
        conversationId: lead.conversationId,
      }).catch(() => {});

      emitEvent("chat_lead.created", {
        leadId: String(lead._id),
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        postcode: lead.postcode,
        serviceType: lead.serviceType,
        status: lead.status,
        source: lead.source,
        conversationId: lead.conversationId,
        suspectedSpam: lead.suspectedSpam,
        suspicionReasons: lead.suspicionReasons,
      });

      if (lead.suspectedSpam) {
        notifyAdminAlert(
          `Suspected spam chat lead: ${lead.name}`,
          [
            `Contact: ${[lead.phone, lead.email].filter(Boolean).join(" · ") || "—"}`,
            `Reasons: ${lead.suspicionReasons.join(", ")}`,
          ].join("\n"),
        ).catch(() => {});
      }
    });

    return res.status(201).json({
      success: true,
      leadId: lead._id,
      message: "Thanks - our team will follow up shortly.",
    });
  } catch (saveErr) {
    console.error("Chat lead save failed:", saveErr);
    return res.status(500).json({
      success: false,
      error: "We could not save your details right now. Please try again.",
    });
  }
});

export default router;
