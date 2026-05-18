import { SITE_NAME, SITE_URL } from "./site";
import { SERVICE_AREAS_BY_SLUG } from "../data/serviceAreasCatalog";

const BUSINESS_NAME = SITE_NAME;
export const MAIN_BUSINESS_ID = `${SITE_URL}#localbusiness`;
const BUSINESS_PHONE = "+442035356331";
const BUSINESS_EMAIL = "info@apexfivecleaning.co.uk";
const BUSINESS_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "123 Main road, Broadway, Sittingbourne plaza",
  addressLocality: "Sittingbourne",
  postalCode: "ME11 2BY",
  addressCountry: "GB",
};

const CITY_NAMES = Object.values(SERVICE_AREAS_BY_SLUG).map((a) => a.name);

export const SERVICE_AREAS = [
  "Kent",
  "Essex",
  "Greater London",
  ...CITY_NAMES,
];

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
