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
