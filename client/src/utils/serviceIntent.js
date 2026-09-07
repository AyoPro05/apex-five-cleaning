export const QUOTE_SERVICE_BY_ID = {
  "domestic-cleaning": "residential",
  residential: "residential",
  "deep-cleaning": "residential",
  "end-of-tenancy-cleaning": "end-of-tenancy",
  "end-of-tenancy": "end-of-tenancy",
  "airbnb-cleaning": "airbnb",
  airbnb: "airbnb",
  "office-cleaning": "commercial",
  "commercial-cleaning": "commercial",
  commercial: "commercial",
  "buggy-toy-cleaning": "buggy-toy-cleaning",
};

export function quoteServiceValue(serviceId = "") {
  return QUOTE_SERVICE_BY_ID[serviceId] || serviceId || "";
}

export function normalisePostcode(value = "") {
  const compact = String(value).trim().toUpperCase().replace(/\s+/g, "");
  if (compact.length <= 3) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}
