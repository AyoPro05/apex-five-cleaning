const CHAT_KNOWLEDGE = [
  {
    topic: "Services",
    keywords: ["services", "cleaning", "residential", "commercial", "airbnb", "tenancy"],
    answer:
      "We offer domestic cleaning, deep cleaning, end of tenancy, Airbnb turnover, office, and commercial cleaning. I can help you pick the right service and start a quote.",
    ctaPath: "/services",
  },
  {
    topic: "Pricing",
    keywords: ["price", "cost", "pricing", "how much", "quote"],
    answer:
      "Typical prices start from around GBP45 for domestic visits, GBP60 for Airbnb turnover, GBP80 for commercial, and GBP150 for end-of-tenancy jobs. Final price depends on property size and scope.",
    ctaPath: "/request-a-quote",
  },
  {
    topic: "Coverage",
    keywords: ["area", "coverage", "where", "kent", "london", "essex", "postcode"],
    answer:
      "We cover Greater London and surrounding South East areas including Kent and Essex. Share your postcode and we can confirm availability quickly.",
    ctaPath: "/service-areas",
  },
  {
    topic: "Trust",
    keywords: ["insured", "vetted", "safe", "products", "eco", "guarantee"],
    answer:
      "Our teams are insured and vetted, and we use eco-conscious products. If anything is not right after a clean, contact us and we will work to resolve it quickly.",
    ctaPath: "/faq",
  },
  {
    topic: "Contact",
    keywords: ["phone", "email", "contact", "address", "call"],
    answer:
      "You can reach us by phone on 020 3535 6331 or email info@apexfivecleaning.co.uk. If you want, I can also collect your details here and our team will follow up.",
    ctaPath: "/contact",
  },
];

const QUICK_REPLIES = ["Get a quote", "Services", "Pricing", "Contact us"];

export function detectIntent(message = "") {
  const lower = String(message).toLowerCase();
  if (/(quote|book|booking|price|cost|estimate)/.test(lower)) return "lead";
  if (/(phone|email|contact|call)/.test(lower)) return "contact";
  if (/(service|airbnb|tenancy|domestic|commercial)/.test(lower)) return "services";
  return "general";
}

export function buildAssistantReply(message = "") {
  const userText = String(message || "").trim();
  const lower = userText.toLowerCase();

  if (!userText) {
    return {
      text: "Hi, I am the Apex Assistant. Tell me what type of cleaning you need and I can guide you or start a quote.",
      quickReplies: QUICK_REPLIES,
      intent: "general",
      recommendLeadCapture: false,
      confidence: 0.3,
    };
  }

  let best = null;
  let bestScore = 0;
  for (const entry of CHAT_KNOWLEDGE) {
    let score = 0;
    for (const key of entry.keywords) {
      if (lower.includes(key)) score += 1;
    }
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  const intent = detectIntent(userText);
  const recommendLeadCapture = intent === "lead";

  if (best && bestScore > 0) {
    return {
      text: best.answer,
      quickReplies: QUICK_REPLIES,
      ctaPath: best.ctaPath,
      intent,
      recommendLeadCapture,
      confidence: Math.min(0.95, 0.45 + bestScore * 0.15),
    };
  }

  return {
    text:
      "I can help with services, pricing guidance, coverage, and booking steps. If you share a few details, I can also pass your enquiry to our team for a quick follow-up.",
    quickReplies: QUICK_REPLIES,
    ctaPath: "/contact",
    intent,
    recommendLeadCapture,
    confidence: 0.35,
  };
}
