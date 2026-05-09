import { SITE_NAME, SITE_URL } from "./site";

const BUSINESS_NAME = SITE_NAME;
const BUSINESS_PHONE = "+447377280558";
const BUSINESS_EMAIL = "info@apexfivecleaning.co.uk";
const BUSINESS_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "123 Main road, Broadway, Sittingbourne plaza",
  addressLocality: "Sittingbourne",
  postalCode: "ME11 2BY",
  addressCountry: "GB",
};

export const SERVICE_AREAS = [
  "Kent",
  "Essex",
  "Greater London",
  "Canterbury",
  "Dover",
  "Maidstone",
  "Tunbridge Wells",
  "Sevenoaks",
  "Ashford",
  "Sheerness-on-Sea",
  "Sittingbourne",
  "Minster-on-Sea",
  "Laindon",
  "Langdon Hills",
  "Brentwood",
  "Basildon",
  "Billericay",
  "Wickford",
  "Southend-on-Sea",
  "Croydon",
];

export const buildLocalBusinessSchema = (overrides = {}) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}#localbusiness`,
  name: BUSINESS_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/apex-five-logo.png`,
  telephone: BUSINESS_PHONE,
  email: BUSINESS_EMAIL,
  priceRange: "£45-£250",
  address: BUSINESS_ADDRESS,
  areaServed: SERVICE_AREAS,
  ...overrides,
});

export const buildWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: BUSINESS_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/blog?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const buildBreadcrumbSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
