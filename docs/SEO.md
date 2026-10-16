# SEO Action Guide — Apex Five Cleaning

Updated 16 October 2026. This is a practical plan for improving the existing site and measuring genuine enquiries. It is not a promise of rankings, traffic, leads, or revenue. Start with free tools; paid SEO software and advertising are not prerequisites.

## Current site checks

- The live homepage and end-of-tenancy page display useful content when JavaScript runs. The public sitemap and robots file are available.
- **Important technical issue to verify:** Vercel rewrites page routes to `client/index.html`. That file contains homepage metadata and an empty React root. React Helmet sets route-specific metadata after JavaScript runs, so the initial HTML response for a service URL can still declare the homepage canonical. The existing SEO test proves the browser-rendered canonical changes; it does not prove the initial HTTP HTML is route-specific.
- This does not prove Google cannot index the service pages: Google can render JavaScript. It does mean the initial response and rendered response differ, and Google advises against changing a page's canonical with JavaScript. Verify this in Search Console and plan route-level prerendering or server rendering if confirmed. Do not rebuild the whole app just because of this finding.
- The Google review button is intentionally hidden until a verified review URL is configured with `VITE_GOOGLE_REVIEW_URL`. Confirm the real Business Profile review link before expecting that button to appear.
- The site already has route-specific SEO metadata, a public sitemap, canonical service routes, permanent redirects for four legacy service URLs, and a two-step quote form. Recheck these after deployments rather than rebuilding them from scratch.

## Week 1: Verify indexing and establish a baseline

### Search Console

1. Add a Domain property for `apexfivecleaning.co.uk` and complete the DNS verification, which requires access to the domain's DNS settings. An HTML verification meta tag is for a URL-prefix property; it is not required for DNS-verified Domain ownership. Bing Webmaster Tools is optional.
2. Submit `https://www.apexfivecleaning.co.uk/sitemap.xml` in Search Console.
3. Inspect the homepage, `/services/end-of-tenancy-cleaning`, `/services/domestic-cleaning`, and `/service-areas/southend-on-sea`.
4. Review the indexed result and run the live URL test. Check the rendered content, screenshot, user-declared canonical, and Google's selected canonical when reported.
5. Confirm the rendered page has its own service title, heading, useful copy, internal links, and a working quote action. Separately compare the initial HTML response with the rendered result.
6. If a page has been materially fixed, request indexing once. A sitemap or indexing request is a discovery signal, not a guarantee of indexing.

Acceptance check: each indexable service page should resolve successfully, have a canonical matching its intended URL, and present the correct service content to both the browser and Google's live test. Prefer route-level prerendering or server rendering to relying on JavaScript to replace the canonical. Keep current routes and redirects intact and test quote submissions before deploying any technical fix. See [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

### Baseline

Record one row per week, using aggregate data:

| Area | Record |
| --- | --- |
| Search | Search Console impressions, clicks, click-through rate, queries, and page indexing issues |
| Enquiries | Valid quote requests, phone enquiries, and genuine messaging enquiries |
| Sales | Qualified enquiries, quotes sent, booked jobs, and revenue from booked jobs |
| Source | Ask customers how they heard about the business; record the answer consistently |
| Work completed | Pages improved, broken links fixed, and relevant partner mentions checked |

Keep customer names, contact details, addresses, and booking information in the private business system, not public spreadsheets, URL parameters, or analytics event names. Search Console measures search visibility, not completed enquiries or bookings.

## Week 2: Strengthen local presence and service pages

### Google Business Profile

Confirm that the profile is verified and eligible, then check the real business name, primary category, services, phone, website, hours, and service areas. Use only accurate information and places the team can genuinely serve. If customers are not received at the listed business address, follow Google's service-area-business rules and hide the address; do not create fictitious branches or virtual offices. Follow [Google's business representation guidelines](https://support.google.com/business/answer/3038177?hl=en) and [local ranking guidance](https://support.google.com/business/answer/4454429?hl=en-GB).

Prioritise Southend-on-Sea and nearby places based on actual capacity, customers, and profitability. The site describes service across Essex, London, and Kent, so confirm that those claims and each listed service area are still operationally accurate before promoting them.

### Improve existing pages first

Start with the three services most likely to produce suitable, profitable bookings. For each page:

- Make the service and genuinely served area clear in the title, main heading, and opening copy.
- Explain inclusions, exclusions, optional extras, access, preparation, and how the quote process works.
- Answer real questions about timing, equipment, pets, availability, and pricing factors.
- Add only approved project photos and genuine, permissioned testimonials. Do not promise deposit outcomes or invent credentials or results.
- Link to relevant service areas, real project examples, and the quote page. Test the tap-to-call link and quote form on a phone.
- Keep the page's canonical URL and sitemap entry aligned with its actual route.

Possible title, if this accurately describes the coverage: `End of Tenancy Cleaning in Southend-on-Sea | Apex Five Cleaning`.

Do not create many near-identical town pages by swapping place names. Publish a location page only when it has useful, truthful local information and a credible service offer; see [Google's spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

## Weeks 3–4: Trust, links, and enquiries

### Reviews and local relationships

Get the real Google review link from the verified Business Profile, test it while signed out, configure `VITE_GOOGLE_REVIEW_URL`, and confirm the review button appears and opens the right destination. Ask all customers consistently for an honest review after completed work. Do not offer incentives, request only positive reviews, prescribe wording, or ask specifically for five stars. See [Google's review guidance](https://support.google.com/business/answer/3474122?hl=en-GB) and [review-content policy](https://support.google.com/business/answer/7400114?hl=en).

Look for genuine relationships with letting agents, property managers, short-let hosts, and complementary local businesses. Offer useful information or a real service relationship; a link is optional, never demanded. Avoid paid bulk backlinks, link exchanges for ranking purposes, and automated directory submissions. Track the exact linking page, target URL, date checked, whether the link still works, and any referral enquiries. Search Console's [Links report](https://support.google.com/webmasters/answer/9049606?hl=en) is a sample, not a complete backlink inventory.

### Test the enquiry path

Use a controlled test to submit the quote form and verify the enquiry reaches the intended admin or inbox, not just that a success message appears. Test phone, WhatsApp, navigation, review links, and gallery controls on mobile. Check broken links monthly; fix the source link, and redirect a removed page only to a genuinely equivalent replacement. An unrelated redirect to the homepage can be treated as a soft 404.

Ask only for information needed to assess a job. State a response-time promise only if the team can reliably meet it, and review unanswered enquiries on working days. Treat clicks as interest, not as completed leads.

### Useful evidence and site speed

Publish genuine project examples or practical cleaning advice only when they help customers decide or prepare. Get permission for photos, remove identifying details, describe the work accurately, and link to the relevant service or quote page. One useful update is better than repeated generic posts.

Use PageSpeed Insights on representative mobile and desktop pages after content or image changes. Prioritise measured problems: resize and compress images, use responsive formats, reserve image dimensions, lazy-load below-the-fold media, and use a poster/click-to-play pattern for video. Do not chase a perfect lab score. The good real-user Core Web Vitals thresholds are LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1 at the 75th percentile; a single test does not establish field performance. See [PageSpeed Insights documentation](https://developers.google.com/speed/docs/insights/v5/about).

## Ongoing routine

| Frequency | Task |
| --- | --- |
| Each working day | Respond to enquiries and update the private booking log |
| After completed work | Send the same neutral request for an honest review |
| Weekly | Improve one priority page or answer one real customer question; review Search Console and qualified enquiries |
| Monthly | Check broken links, conversion routes, valuable partner links, and Business Profile details |
| After a significant content change | Update the sitemap `lastmod` date accurately and inspect the affected URL |

Compare similar periods and distinguish visibility, enquiry, and booking outcomes. Use the measure `booked jobs ÷ qualified enquiries × 100` for booking conversion; do not treat rankings, button clicks, or traffic as a substitute for sales. The sensible order is: verify route metadata and indexing, check the Business Profile, improve important service pages, configure honest review requests, build real local relationships, then assess bookings. Buy a paid SEO tool only when a specific unmet need justifies its cost.

## Implementation reference

- `client/src/components/SEO.jsx` sets titles, descriptions, canonicals, robots directives, social metadata, and JSON-LD after the React app runs.
- `client/index.html` supplies the static homepage metadata and the initial React root.
- `client/public/robots.txt` allows crawling and blocks private paths; `client/public/sitemap.xml` lists public canonical routes.
- `client/src/config/seoSchemas.js` builds the site's structured data. Valid schema helps describe content; it does not guarantee rankings or rich results.
- `client/src/config/site.js` reads the review destination from `VITE_GOOGLE_REVIEW_URL`.
- `client/src/components/SEO.test.jsx` checks rendered metadata. It does not test route-specific metadata in the raw HTTP response.

For deployment, verify `/`, `/services/end-of-tenancy-cleaning`, `/sitemap.xml`, and the legacy service redirects on the production domain. Vite preview does not verify Vercel's HTTP redirects. Recheck Search Console after deployment; code changes alone do not prove rankings or revenue gains.
