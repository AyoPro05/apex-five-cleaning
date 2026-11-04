# SEO Audit Backlog

## Findings

Add each new finding using this format:

```text
ID:

Finding:

Priority: High / Medium / Low

Evidence:

Affected file or URL:

Recommended action:

Status: Investigate / Planned / Completed

Verification:
```

Keep the backlog focused on open findings. The user will identify when a finding can be closed; remove or archive it at that point so resolved issues do not accumulate here.

### SEO-010 — 4 November 2026

- **Finding:** The URL is discovered by Google but is currently not indexed.
- **Priority:** High
- **Evidence:** Google Search Console detects `https://www.apexfivecleaning.co.uk/sitemap.xml` as the referring sitemap and page. Last recorded normal crawl: N/A. Live crawl, indexing permissions, and self-referencing canonical previously passed.
- **Affected file or URL:** URL under inspection (exact URL not provided); referring sitemap: `https://www.apexfivecleaning.co.uk/sitemap.xml`.
- **Assessment:** URL discovery is confirmed. No technical restriction has been demonstrated.
- **Recommended action:** Review internal linking signals and local content quality. Continue monitoring without repeatedly requesting indexing.
- **Status:** Monitoring
- **Verification:** Monitor Search Console indexing status and review internal links and local content quality.

### SEO-018 — 4 November 2026

- **Finding:** Service card navigation is handled with JavaScript; the "Learn More" button calls `navigate('/request-a-quote')`.
- **Priority:** Medium
- **Evidence:** `Learn More` button uses `navigate('/request-a-quote')`.
- **Affected file or URL:** `client/src/pages/ServiceArea.jsx`.
- **Potential improvement:** Replace navigation-only buttons with semantic links, preserving styling, accessibility, and behavior.
- **Status:** Planned
- **Verification:** Confirm rendered anchor has an `href`, check keyboard navigation, and verify quote-page functionality.

### SEO-019 — Location Page Content Uniqueness

- **Priority:** High
- **Status:** Implemented locally; code review and deployment pending.
- **Affected files:** `client/src/pages/ServiceArea.jsx`; `client/src/data/serviceAreasCatalog.js`.
- **Finding:** Southend-on-Sea location page currently lists 3 services, while the business confirms 8 main cleaning categories plus specialist tasks.
- **Confirmed categories:** Residential/regular house cleaning; end of tenancy cleaning; Airbnb/holiday let turnover; deep cleaning; office cleaning; commercial cleaning; after builders cleaning; carpet/upholstery cleaning.
- **Additional tasks:** Interior window cleaning, skirting boards, oven, microwave, cupboard cleaning and organisation, and fridge cleaning.
- **Implementation:** Expanded Southend-on-Sea to eight confirmed services, improved local content and specialist task descriptions, and added targeted tests.
- **Validation reported:** 4 tests passed; production build successful; `git diff --check` passed.
- **Remaining:** Review actual diff, verify rendered content locally, commit, deploy, and verify the live page.
- **Related issue:** SEO-020 testimonial attribution remains open.

### SEO-020 — Location Testimonial Attribution

- **Priority:** High
- **Status:** Investigate
- **Affected file:** `client/src/pages/ServiceArea.jsx`.
- **Finding:** A shared testimonial is dynamically attributed to a customer in each location.
- **Recommended action:** Verify the testimonial and location attribution. Use genuine feedback or remove unsupported attribution.
- **Verification:** Confirm the customer review source and attribution.

### SEO-021 — Southend-on-Sea Local Hero Image

- **Priority:** Medium
- **Status:** Local browser verification passed; deployment pending.
- **Image:** `client/public/images/services/Southend_Hero.webp` (48 KB).
- **Implementation:** Replaced Southend-on-Sea's remote Unsplash hero image reference with a locally hosted photograph of Southend Pier.
- **Verification:** Browser screenshot confirmed the image renders; Network tab showed HTTP 304 Not Modified; hero heading and CTA buttons remain readable.
- **Next:** Include the image and catalogue update in a reviewed Git commit, deploy, and verify in production.

## Completed findings

### SEO-017 — Crawlable Service Area Links

- **Status:** Completed
- **Completed:** 4 November 2026
- **Commit:** `db9ca83`
- **Implementation:** Replaced JavaScript navigation buttons with React Router `Link` elements for areas with detail pages.
- **Verification:** 3 automated tests passed, Vite production build successful, and production HTML confirmed `<a href="/service-areas/southend-on-sea">` with keyboard focus support.
- **Outcome:** Improved semantic internal linking and crawlable navigation. Indexing impact remains to be measured.
