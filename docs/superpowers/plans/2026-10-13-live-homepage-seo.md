# Live Homepage SEO Implementation Plan

**Goal:** Improve organic discovery and quote conversion on the committed website while retaining its photo hero, postcode entry, telephone actions and existing page structure.

**Baseline:** GitHub main at `03918186666c152eaa08b9c3015f8bd766ef45e9`. The abandoned local redesign is archived outside the repository at `/private/tmp/apex-five-cleaning-draft.vQIFNs/local-draft.tar.gz`.

**Architecture:** Keep the existing React/Vite application and marketing components. Use shared metadata, schema and quote-prefill helpers. Keep business information and service prices grounded in the committed service catalogue.

## Implementation

- [x] Restore the committed `client/src/pages/Home.jsx`, footer and styles; remove the abandoned homepage components and data.
- [x] Update `Home.jsx` with local search copy, business/website schema, genuine links to existing service-area pages and concise visible FAQs. Retain the live headline, photo composition, postcode form and call button.
- [x] Add accessible postcode format validation in `QuoteStarter.jsx` using the shared postcode helpers. Retain postcode transfer into `Quote.jsx`; do not claim to confirm coverage or availability.
- [x] Preserve service-specific quote intent and local metadata in `ServiceDetail.jsx`. Use valid `Service`, business, FAQ and breadcrumb schemas; show a non-indexable not-found page for unknown services.
- [x] Align `client/index.html` metadata ownership with `SEO.jsx` so navigation replaces fallback canonicals and descriptions. Correct sitemap service URLs and add permanent redirects for the four committed legacy aliases in `client/vercel.json`.
- [x] Generate smaller versions of the same homepage photographs and prioritise the hero download. Lazy-load secondary routes in `App.jsx` to reduce initial JavaScript.
- [x] Replace the abandoned homepage tests with regression coverage for the retained photo/postcode/call flow, canonical URLs and schema. Cover malformed postcodes and unknown service routes.
- [x] Run the client tests and production build. Check desktop/mobile screenshots, image loading, quote prefill, route metadata and links in a browser. Update `docs/SEO.md` with the release and Search Console follow-up.
- [x] Fix browser/review findings: display-only area links, missing area-page metadata, invalid schema actions, mobile header overlap, tablet navigation overflow, footer toolbar clearance and short-screen chat/menu access.

## Verification Results

- Client suite: 31 tests passed across 13 files.
- Production build: passed; main JavaScript decreased from 541.44 kB to 472.30 kB before gzip.
- Original hero photo: 2,444,040 bytes to 194,910 bytes; mobile hero: 74,012 bytes. Five homepage photo downloads total 404,338 bytes, compared with 14,616,649 bytes for their original PNG versions.
- Browser checks passed against development and production builds at 1440x1000, 768x1024, 390x844 and 320x740. Quote prefill, malformed postcodes, service intent, canonical/description uniqueness, legacy browser redirects and the Southend area link were verified.
- Additional short-screen checks at 375x568 and 1024x540 cover chat closing, signed-in menu scrolling, search access and footer control clearance. Reduced-motion preferences are respected.
- `git diff --check` passed. An independent code review was performed, and its findings were fixed and verified in the browser.

## Release

Review the final diff against the committed baseline. Keep the work ready for the existing GitHub/Vercel deployment; record verification results before publishing. Search Console screenshots show limited search exposure but do not establish how many pages are indexed. After deployment, submit the sitemap and inspect priority URLs in Search Console.
