# SEO Checklist — Apex Five Cleaning (A-E)

This project now follows a 5-part SEO workflow for technical, local, and content SEO.

## A) Technical foundation

- `client/src/components/SEO.jsx` is the single source of truth for:
  - title, description, canonical, robots
  - Open Graph and Twitter meta tags
  - JSON-LD script injection
- `client/public/robots.txt` allows crawling and blocks private paths (`/admin/`, `/api/`, `/.env`).
- `client/public/sitemap.xml` includes indexable public pages and service-area routes.
- Internal utility pages use `noindex` (payment/auth flows) to prevent low-value indexing.

## B) Structured data

- Shared schema builders live in `client/src/config/seoSchemas.js`.
- Core schema types in use:
  - `WebSite`
  - `LocalBusiness`
  - `BreadcrumbList`
  - `ItemList`
  - `Review` (testimonials)
- Key pages wired with JSON-LD:
  - `/`
  - `/services`
  - `/service-areas`
  - `/service-areas/:areaSlug`
  - `/contact`
  - `/testimonials`

## C) On-page SEO

- Public pages include route-specific titles/descriptions through `<SEO />`.
- Legal pages now have indexable metadata:
  - `/privacy-policy`
  - `/terms-of-service`
- Keep each page focused on one primary intent (service, location, support, etc.).

## D) Local SEO

- LocalBusiness schema includes service coverage across Kent, Essex, and Greater London areas.
- Service-area URLs are indexable and listed in sitemap.
- Contact information is consistent across structured data and page content.

## E) Verification & monitoring

1. Add verification tags in `client/index.html` for:
   - Google Search Console
   - Bing Webmaster Tools
2. Submit sitemap:
   - `https://www.apexfivecleaning.co.uk/sitemap.xml`
3. Validate markup:
   - [Google Rich Results Test](https://search.google.com/test/rich-results)
   - [Schema.org validator](https://validator.schema.org/)
4. Re-crawl priority pages after major updates (home, services, service areas).
5. Update `lastmod` in sitemap when:
   - service areas change
   - major page content changes
   - new blog posts are published

## October 2026 Homepage Update

The homepage retains the photo hero, headline, postcode quote starter and telephone actions from GitHub commit `0391818`. The abandoned local redesign is not part of this release.

- Homepage metadata targets Southend-on-Sea and nearby Essex towns. Existing service cards and new area links point to real canonical routes.
- Homepage business, website and FAQ structured data uses the actual service catalogue and visible FAQ answers. Service pages use Schema.org `Service`, linked `LocalBusiness`, FAQ and breadcrumb markup.
- Static fallback search metadata is marked as managed by React Helmet so navigation replaces it, leaving one canonical URL and description per rendered page. The viewport remains permanently in static HTML.
- The sitemap lists the seven canonical service detail URLs. Four legacy service aliases have permanent Vercel redirects and matching browser redirects. Unknown service URLs show a non-indexable not-found page.
- The postcode starter checks UK postcode format and retains the postcode in the existing quote form, including React development mount checks. Format validation does not confirm that a postcode exists or that a booking is available.
- The original homepage photos are delivered as smaller WebP images, with a separate mobile hero. Non-home routes are downloaded when visited.
- Existing area detail pages now have their own canonical metadata and link their service schema to the real Southend office. Display-only town links lead to the service-area directory rather than a missing detail page.
- Responsive navigation avoids tablet overflow. The mobile quote bar sits at the viewport bottom, with reserved space for chat, and the referral announcement fits above the header.

### Deployment Checks

1. Deploy through the existing GitHub/Vercel project after reviewing the final diff.
2. Confirm `/`, `/services/end-of-tenancy-cleaning`, `/sitemap.xml` and the four legacy redirects on the production domain. Vite preview verifies browser redirects; Vercel's HTTP redirects require a deployment check.
3. Submit `https://www.apexfivecleaning.co.uk/sitemap.xml` in Search Console and inspect the homepage plus priority service URLs using the live URL test. Request indexing where appropriate.
4. Export the Page Indexing report and standard Search Results report with queries, impressions, clicks, CTR and average position. The supplied screenshots show search exposure and AI-feature impressions; they do not establish how many pages are indexed or why any page is excluded.
5. Compare organic quote enquiries and calls alongside Search Console results after Google recrawls. Code changes alone do not establish ranking or revenue gains.

The site remains a client-rendered React application. Route-specific metadata and content are available after JavaScript executes; browser tests verify that rendered output. [Google's JavaScript SEO documentation](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) describes Google's rendering process.
