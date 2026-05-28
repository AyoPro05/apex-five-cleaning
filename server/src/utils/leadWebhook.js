/**
 * LEAD WEBHOOK
 * Posts new-lead/new-quote alerts to LEADS_WEBHOOK_URL.
 * Slack-compatible payload, also works with Discord, Make, n8n, or any HTTP endpoint.
 *
 * Set LEADS_WEBHOOK_URL to enable. Leave unset to disable cleanly.
 */

import axios from "axios";

const TIMEOUT_MS = 5000;

const isHotChatLead = (lead) => {
  // Hot = has phone AND postcode (or service type) — i.e. enough to follow up fast
  return Boolean(lead?.phone && (lead?.postcode || lead?.serviceType));
};

const getWebhookUrl = () => {
  const url = process.env.LEADS_WEBHOOK_URL;
  return url && url.trim() ? url.trim() : "";
};

const post = async (label, payload) => {
  const url = getWebhookUrl();
  if (!url) return { skipped: true };
  try {
    await axios.post(url, payload, {
      timeout: TIMEOUT_MS,
      headers: { "Content-Type": "application/json" },
    });
    console.log(`✓ Lead webhook posted: ${label}`);
    return { success: true };
  } catch (error) {
    console.warn(`⚠️ Lead webhook failed (${label}):`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Notify on a new chat lead. Only alerts when the lead is "hot" (has phone + context).
 */
export async function notifyHotChatLead(lead) {
  if (!isHotChatLead(lead)) return { skipped: true };
  const headline = `🔥 Hot chat lead: ${lead.name || "Unknown"} — ${lead.serviceType || "service unspecified"}${
    lead.postcode ? ` in ${lead.postcode}` : ""
  }`;
  const contact = [lead.phone, lead.email].filter(Boolean).join(" · ");
  return post("chat_lead", {
    text: headline,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*${headline}*` } },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `Contact: ${contact || "—"}`,
            lead.message ? `Message: ${String(lead.message).slice(0, 240)}` : "",
            lead.conversationId ? `Conv: ${lead.conversationId}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      },
    ],
    meta: { event: "chat_lead.created", lead },
  });
}

/**
 * Notify on a new quote submission.
 */
export async function notifyNewQuote(quote) {
  if (!quote) return { skipped: true };
  const ref = quote.reference || String(quote._id || "");
  const headline = `📝 New quote ${ref} — ${quote.firstName || ""} ${quote.lastName || ""}`.trim();
  const summary = [
    `Service: ${quote.serviceType || "—"}`,
    `Property: ${quote.propertyType || "—"} (${quote.bedrooms || "?"} bed / ${quote.bathrooms || "?"} bath)`,
    `Postcode: ${quote.postcode || "—"}`,
    `Phone: ${quote.phone || "—"}`,
    `Email: ${quote.email || "—"}`,
  ].join("\n");
  return post("quote_created", {
    text: headline,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*${headline}*` } },
      { type: "section", text: { type: "mrkdwn", text: summary } },
    ],
    meta: {
      event: "quote.created",
      reference: ref,
      service: quote.serviceType,
      postcode: quote.postcode,
    },
  });
}

/**
 * Optional admin alert for stuck items / system warnings.
 */
export async function notifyAdminAlert(title, body) {
  return post("admin_alert", {
    text: `⚠️ ${title}`,
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: `*⚠️ ${title}*` } },
      { type: "section", text: { type: "mrkdwn", text: String(body || "").slice(0, 1200) } },
    ],
    meta: { event: "admin.alert", title },
  });
}

export function isLeadWebhookConfigured() {
  return Boolean(getWebhookUrl());
}
