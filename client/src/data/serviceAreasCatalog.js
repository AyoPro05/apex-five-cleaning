/**
 * Single source of truth for service area pages, nav regions (Home + Service Areas),
 * and coverage copy aligned with /service-areas/:slug detail pages.
 */

export const SERVICE_AREAS_BY_SLUG = {
  canterbury: {
    name: "Canterbury",
    region: "Kent",
    coverage: "Canterbury, Whitstable, Herne Bay, Faversham",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Serving the historic Canterbury area and surrounding communities for over 5 years.",
    highlights: [
      "Same-day quotes for local properties",
      "Quick response times in central Canterbury",
      "Specialist in period property cleaning",
      "Regular discounts for local residents",
    ],
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.2793, lng: 1.0832 },
  },
  dover: {
    name: "Dover",
    region: "Kent",
    coverage: "Dover, Folkestone, Deal, Walmer",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Professional cleaning services across Dover and the surrounding coastal communities.",
    highlights: [
      "Coastal property specialists",
      "Salt-spray cleaning expertise",
      "Fast turnaround for seasonal rentals",
      "Port area property experience",
    ],
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.1289, lng: 1.3127 },
  },
  maidstone: {
    name: "Maidstone",
    region: "Kent",
    coverage: "Maidstone, Ashford, Sittingbourne",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Trusted cleaning partner for Maidstone homeowners and property managers.",
    highlights: [
      "Large house specialists",
      "Multiple property management support",
      "End-of-tenancy deposit recovery specialists",
      "Commercial property experience",
    ],
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.2707, lng: 0.5197 },
  },
  "tunbridge-wells": {
    name: "Tunbridge Wells",
    region: "Kent",
    coverage: "Tunbridge Wells, Sevenoaks, Royal Tunbridge Wells",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Premium cleaning services for the affluent Tunbridge Wells community.",
    highlights: [
      "Luxury property specialists",
      "Attention to detail for high-value homes",
      "Flexible scheduling for busy professionals",
      "Discretion and reliability guaranteed",
    ],
    image:
      "https://images.unsplash.com/photo-1517841905240-74f67b4dcb80?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.1829, lng: 0.274 },
  },
  sevenoaks: {
    name: "Sevenoaks",
    region: "Kent",
    coverage: "Sevenoaks, Orpington, Eynsford",
    responseTime: "24 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Serving affluent Sevenoaks and surrounding villages with premium cleaning services.",
    highlights: [
      "Large estate property expertise",
      "Village property specialists",
      "Extensive references available",
      "Eco-friendly premium service",
    ],
    image:
      "https://images.unsplash.com/photo-1507995881394-2c58d5d0d81c?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.1544, lng: 0.1759 },
  },
  ashford: {
    name: "Ashford",
    region: "Kent",
    coverage: "Ashford, Tenterden, Charing",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Comprehensive cleaning solutions for Ashford and surrounding rural communities.",
    highlights: [
      "Rural property specialists",
      "Flexible scheduling for remote properties",
      "Agricultural property experience",
      "Community-focused service",
    ],
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.1447, lng: 0.8738 },
  },
  sheerness: {
    name: "Sheerness-on-Sea",
    region: "Kent",
    coverage: "Sheerness-on-Sea, Queenborough, Minster-on-Sea",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Specialist coastal cleaning for Sheerness and Isle of Sheppey communities.",
    highlights: [
      "Seaside property specialists",
      "Salt-air cleaning expertise",
      "Holiday let specialists",
      "Quick turnaround cleaning",
    ],
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.4421, lng: 0.7491 },
  },
  sittingbourne: {
    name: "Sittingbourne",
    region: "Kent",
    coverage: "Sittingbourne, Faversham, Whitstable",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Professional cleaning services across Kent including Sittingbourne and Faversham.",
    highlights: [
      "Family home specialists",
      "End-of-tenancy deposit recovery focus",
      "Regular customer loyalty discounts",
      "Eco-friendly service provider",
    ],
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.3462, lng: 0.7417 },
  },
  "minster-on-sea": {
    name: "Minster-on-Sea",
    region: "Kent",
    coverage: "Minster-on-Sea, Sittingbourne, Isle of Sheppey",
    responseTime: "24-48 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Specialist coastal and rural cleaning services for Minster-on-Sea and surrounding areas.",
    highlights: [
      "Coastal property specialists",
      "Rural and village expertise",
      "Fast response times",
      "Customer-focused service",
    ],
    image:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.4176, lng: 0.8447 },
  },
  laindon: {
    name: "Laindon",
    region: "Essex",
    coverage: "Laindon, Basildon",
    responseTime: "24-48 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Reliable cleaning services across Laindon and nearby Basildon neighborhoods.",
    highlights: [
      "Fast quote turnaround for local homes",
      "Flexible appointment slots",
      "Trusted and insured cleaning team",
      "Eco-friendly product options",
    ],
    image:
      "https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.5748, lng: 0.4287 },
  },
  "langdon-hills": {
    name: "Langdon Hills",
    region: "Essex",
    coverage: "Langdon Hills, Basildon outskirts",
    responseTime: "24-48 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Professional home and tenancy cleaning for Langdon Hills households.",
    highlights: [
      "Hillside and suburban property expertise",
      "Detail-focused deep cleaning",
      "Regular and one-off service plans",
      "Friendly local team support",
    ],
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.5611, lng: 0.4106 },
  },
  brentwood: {
    name: "Brentwood",
    region: "Essex",
    coverage: "Brentwood, Shenfield, Hutton",
    responseTime: "24 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Premium and routine cleaning support for Brentwood and surrounding areas.",
    highlights: [
      "High-standard finish for busy households",
      "Move-in and move-out cleaning specialists",
      "Weekend availability by request",
      "Consistent quality and punctuality",
    ],
    image:
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.6214, lng: 0.3057 },
  },
  basildon: {
    name: "Basildon",
    region: "Essex",
    coverage: "Basildon, Pitsea, Vange",
    responseTime: "24-48 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Comprehensive cleaning services for families, landlords, and short-let hosts in Basildon.",
    highlights: [
      "Fast support for tenancy turnovers",
      "Strong local area coverage",
      "Affordable plans with clear pricing",
      "Responsive customer communication",
    ],
    image:
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.5724, lng: 0.4700 },
  },
  billericay: {
    name: "Billericay",
    region: "Essex",
    coverage: "Billericay, Little Burstead, Great Burstead",
    responseTime: "24-48 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Dedicated cleaning services for Billericay homes and local rental properties.",
    highlights: [
      "Thorough home refresh services",
      "End-of-tenancy quality standards",
      "Flexible recurring cleans",
      "Friendly and vetted professionals",
    ],
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.6288, lng: 0.4184 },
  },
  wickford: {
    name: "Wickford",
    region: "Essex",
    coverage: "Wickford, Runwell, Battlesbridge",
    responseTime: "24-48 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Reliable routine and deep cleaning solutions for Wickford and nearby communities.",
    highlights: [
      "Flexible scheduling around work hours",
      "Family-safe eco cleaning options",
      "Consistent standards across visits",
      "Prompt booking confirmations",
    ],
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.6112, lng: 0.5238 },
  },
  "southend-on-sea": {
    name: "Southend-on-Sea",
    region: "Essex",
    coverage: "Southend axis incl. Westcliff-on-Sea and Leigh-on-Sea",
    responseTime: "24-48 hours",
    servicesCovered: ["Residential Cleaning", "End of Tenancy", "Airbnb Turnover"],
    localInfo: "Professional cleaning support across the Southend-on-Sea coastal axis.",
    highlights: [
      "Coastal property cleaning experience",
      "Holiday let and Airbnb turnaround support",
      "Fast response across key Southend districts",
      "Trusted and insured cleaning operatives",
    ],
    image:
      "https://images.unsplash.com/photo-1472224371017-08207f84aaae?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.5459, lng: 0.7077 },
  },
  croydon: {
    name: "Croydon",
    region: "Greater London, Surrey",
    coverage: "Croydon, Coulsdon, Sanderstead, Purley",
    responseTime: "24 hours",
    servicesCovered: [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
    ],
    localInfo:
      "Premium cleaning services for South London and Greater London areas.",
    highlights: [
      "London property specialists",
      "Rapid response times (24 hours)",
      "Professional team experienced with city properties",
      "Flexible weekend scheduling available",
    ],
    image:
      "https://images.unsplash.com/photo-1517841905240-74f67b4dcb80?w=1200&h=600&fit=crop",
    coordinates: { lat: 51.3758, lng: -0.1045 },
  },
};

/** Display order for regional groups on Home and Service Areas */
export const ORDERED_AREA_SLUGS = [
  "canterbury",
  "dover",
  "maidstone",
  "tunbridge-wells",
  "sevenoaks",
  "ashford",
  "sheerness",
  "sittingbourne",
  "minster-on-sea",
  "laindon",
  "langdon-hills",
  "brentwood",
  "basildon",
  "billericay",
  "wickford",
  "southend-on-sea",
  "croydon",
];

const NAV_REGION_META = [
  {
    key: "kent",
    name: "Kent",
    description:
      "Our primary service area covering East, Central Kent, including Swale towns",
  },
  {
    key: "essex",
    name: "Essex",
    description: "Coverage across key Essex towns and commuter areas",
  },
  {
    key: "london",
    name: "London & South East",
    description: "Expanding service to Greater London and surrounding areas",
  },
];

function navBucketForArea(area) {
  if (area.region === "Essex") return "essex";
  if (
    area.region.includes("London") ||
    area.region.includes("Greater London")
  ) {
    return "london";
  }
  return "kent";
}

/** Regions + area cards for Home and `/service-areas` — coverage matches detail pages */
export function getServiceAreaRegionsForNav() {
  const buckets = { kent: [], essex: [], london: [] };
  for (const slug of ORDERED_AREA_SLUGS) {
    const area = SERVICE_AREAS_BY_SLUG[slug];
    const bucket = navBucketForArea(area);
    buckets[bucket].push({
      name: area.name,
      slug,
      coverage: area.coverage,
    });
  }
  return NAV_REGION_META.map((meta) => ({
    name: meta.name,
    description: meta.description,
    areas: buckets[meta.key],
  }));
}
