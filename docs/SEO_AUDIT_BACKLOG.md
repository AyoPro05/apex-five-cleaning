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

### SEO-017 — 4 November 2026

- **Finding:** The Southend-on-Sea location card uses a button rather than an anchor with `href`.
- **Priority:** High
- **Evidence:** Confirmed finding for the `/service-areas` page.
- **Affected file or URL:** `/service-areas` (implementation in `client/src/pages/ServiceAreas.jsx`).
- **Impact:** Google may not reliably discover navigation destinations through button click handlers.
- **Recommended action:** Replace navigation buttons with React Router `Link` or normal anchor elements, preserving styling and functionality.
- **Status:** Local validation passed; deployment pending.
- **Implementation files:** `client/src/pages/ServiceAreas.jsx` and `client/src/pages/ServiceAreas.test.jsx`.
- **Validation:** 3 tests passed, 0 failed. Production build successful.
- **Browser verification:** Southend-on-Sea card renders as `<a href="/service-areas/southend-on-sea">` and is keyboard focusable.
- **Next:** Review final Git status before committing and deployment.

### SEO-018 — 4 November 2026

- **Finding:** Service card navigation is handled with JavaScript; the "Learn More" button calls `navigate('/request-a-quote')`.
- **Priority:** Medium
- **Evidence:** `Learn More` button uses `navigate('/request-a-quote')`.
- **Affected file or URL:** `client/src/pages/ServiceArea.jsx`.
- **Potential improvement:** Replace navigation-only buttons with semantic links, preserving styling, accessibility, and behavior.
- **Status:** Planned
- **Verification:** Confirm rendered anchor has an `href`, check keyboard navigation, and verify quote-page functionality.
