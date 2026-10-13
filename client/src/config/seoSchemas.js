import {
  COMPANY_ADDRESS_LINE1,
  PHONE_MAIN_HREF,
  PHONE_MAIN_TEL,
  SITE_NAME,
  SITE_URL,
  SOCIAL_LINKS,
} from "./site";
import {
  APPROVED_ESSEX_LOCATION_NAMES,
  SERVICE_AREAS_BY_SLUG,
} from "../data/serviceAreasCatalog";
import { SERVICES } from "../data/servicesCatalog";

const BUSINESS_NAME = SITE_NAME;
export const MAIN_BUSINESS_ID = `${SITE_URL}#localbusiness`;
const BUSINESS_PHONE = PHONE_MAIN_TEL;
const BUSINESS_EMAIL = "info@apexfivecleaning.co.uk";
const BUSINESS_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: COMPANY_ADDRESS_LINE1,
  addressLocality: "Southend-on-Sea",
  postalCode: "SS1 2BB",
  addressRegion: "England",
  addressCountry: "GB",
};

const CITY_NAMES = Object.values(SERVICE_AREAS_BY_SLUG).map((a) => a.name);

export const SERVICE_AREAS = [
  "Essex",
  "London",
  "Kent",
  ...APPROVED_ESSEX_LOCATION_NAMES,
  ...CITY_NAMES,
].filter((area, index, areas) => areas.indexOf(area) === index);

/** Primary label for titles (e.g. "Greater London" from "Greater London, Surrey") */
export const primaryRegionLabel = (region) =>
  region.split(",")[0].trim();

/**
 * Meta description for location pages; keeps length reasonable for SERPs.
 */
export const buildServiceAreaMetaDescription = (area) => {
  const region = primaryRegionLabel(area.region);
  const core = `${BUSINESS_NAME}: eco-friendly residential, end of tenancy & Airbnb cleaning in ${area.name} (${region}). Serving ${area.coverage}. Typical quotes ${area.responseTime}.`;
  return core.length > 168 ? `${core.slice(0, 165)}…` : core;
};

/**
 * Location landing SEO: WebPage + Service (linked to main LocalBusiness @id) + breadcrumbs.
 * Avoids duplicate/conflicting LocalBusiness NAP per city.
 */
export const buildServiceAreaPageSchemas = (slug, area) => {
  const pageUrl = `${SITE_URL}/service-areas/${slug}`;
  const region = primaryRegionLabel(area.region);
  const meta = buildServiceAreaMetaDescription(area);

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: `Cleaning Services in ${area.name}, ${region}`,
    description: meta,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: BUSINESS_NAME,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: area.image,
    },
    about: {
      "@type": "Place",
      name: area.name,
      geo: {
        "@type": "GeoCoordinates",
        latitude: area.coordinates.lat,
        longitude: area.coordinates.lng,
      },
    },
  };

  const cleaningService = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#cleaning-service`,
    name: `Professional cleaning in ${area.name}`,
    description: `${area.localInfo} Coverage includes ${area.coverage}.`,
    serviceType: area.servicesCovered,
    provider: { "@id": MAIN_BUSINESS_ID },
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: area.coordinates.lat,
        longitude: area.coordinates.lng,
      },
      geoRadius: 30000,
    },
    url: pageUrl,
  };

  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Service Areas", url: `${SITE_URL}/service-areas` },
    { name: area.name, url: pageUrl },
  ]);

  return [webPage, cleaningService, breadcrumbs];
};

export const buildLocalBusinessSchema = (overrides = {}) => ({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": MAIN_BUSINESS_ID,
  name: BUSINESS_NAME,
  url: SITE_URL,
  image: `${SITE_URL}/apex-five-logo.png`,
  telephone: BUSINESS_PHONE,
  email: BUSINESS_EMAIL,
  priceRange: "£45-£250",
  address: BUSINESS_ADDRESS,
  areaServed: SERVICE_AREAS,
  sameAs: SOCIAL_LINKS.map(({ url }) => url),
  ...overrides,
});

export const buildWebSiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}#website`,
  name: BUSINESS_NAME,
  url: SITE_URL,
});

export const buildFAQPageSchema = (faqs = []) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question || faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer || faq.a,
    },
  })),
});

export const buildHomePageSchemas = (faqs = []) => [
  buildLocalBusinessSchema({
    description:
      "Apex Five Cleaning provides domestic, deep, end of tenancy, Airbnb, office and commercial cleaning in Southend-on-Sea and across Essex, Kent and London.",
    areaServed: [
      "Southend-on-Sea",
      "Leigh-on-Sea",
      "Rayleigh",
      "Rochford",
      "Benfleet",
      "Essex",
      "Kent",
      "London",
    ],
    makesOffer: SERVICES.slice(0, 6).map((service) => ({
      "@type": "Offer",
      url: `${SITE_URL}/services/${service.id}`,
      itemOffered: {
        "@type": "Service",
        name: service.title,
        url: `${SITE_URL}/services/${service.id}`,
      },
    })),
  }),
  buildWebSiteSchema(),
  buildFAQPageSchema(faqs),
];

const SOUTHEND_SERVICE_AREAS = [
  "Southend-on-Sea",
  "Leigh-on-Sea",
  "Westcliff-on-Sea",
  "Thorpe Bay",
  "Rayleigh",
  "Rochford",
  "Benfleet",
  "Essex",
  "Kent",
  "London",
];

export const buildServiceDetailSchemas = (service) => {
  const serviceUrl = `${SITE_URL}/services/${service.id}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${serviceUrl}#cleaning-service`,
      name: `${service.title} in Southend-on-Sea`,
      serviceType: service.title,
      description: service.shortDescription,
      provider: { "@id": MAIN_BUSINESS_ID },
      areaServed: SOUTHEND_SERVICE_AREAS.map((name) => ({
        "@type": name === "Essex" || name === "Kent" || name === "London" ? "AdministrativeArea" : "City",
        name,
      })),
      url: serviceUrl,
      image: service.image.startsWith("http") ? service.image : `${SITE_URL}${service.image}`,
      offers: {
        "@type": "Offer",
        url: serviceUrl,
        priceCurrency: "GBP",
        description: service.priceGuide,
        eligibleRegion: "Southend-on-Sea, Essex, Kent and London",
      },
      providerMobility: "dynamic",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${serviceUrl}#webpage`,
      url: serviceUrl,
      name: `${service.title} Southend-on-Sea`,
      description: service.shortDescription,
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name: BUSINESS_NAME,
      },
      about: {
        "@id": `${serviceUrl}#cleaning-service`,
      },
    },
    buildFAQPageSchema(service.faqs),
    buildBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Services", url: `${SITE_URL}/services` },
      { name: service.title, url: serviceUrl },
    ]),
    buildLocalBusinessSchema({
      telephone: BUSINESS_PHONE,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: BUSINESS_PHONE,
        contactType: "customer service",
        url: PHONE_MAIN_HREF,
        areaServed: "GB",
      },
    }),
  ];
};

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
