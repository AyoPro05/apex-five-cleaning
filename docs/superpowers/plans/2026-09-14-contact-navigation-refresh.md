# Contact and Navigation Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace active old contact data with the canonical Southend address and WhatsApp number, simplify the shared responsive navbar, and verify the result visually and with repository checks.

**Architecture:** Keep `client/src/config/site.js` as the frontend contact-data source of truth and add one backend contact configuration module for email templates that cannot import frontend code. Keep `Navbar.jsx` as the single responsive navigation surface with one ordered link list. Audit and update only active application code, templates, metadata, configuration, seed data, and documentation; leave git history, lockfiles, dependencies, generated output, archived files, and unrelated third-party content unchanged.

**Tech Stack:** React 18, Vite, Tailwind CSS, Vitest, Express/Node.js, email templates in `server/src/utils/emailService.js`, Playwright/browser visual checks.

---

## Audit Findings Before Implementation

The read-only audit found these old active values:

- Address in `client/src/config/site.js`: `91 Manor Road, Wallington`, `SM6 0AP, Surrey` and the matching Google Maps query.
- Address in `client/src/config/seoSchemas.js`: `streetAddress: "91 Manor Road"`, `addressLocality: "Wallington"`, `postalCode: "SM6 0AP"`, `addressRegion: "Surrey"`.
- Address in `server/src/utils/emailService.js`: hard-coded email address lines and fallback HTML address.
- Address in `server/.env.example`: `COMPANY_ADDRESS=91 Manor Road, Wallington\\nSM6 0AP, Surrey`.
- Address in `docs/EMAIL.md`: the documented `COMPANY_ADDRESS` default.
- Old WhatsApp digits in `client/src/config/site.js`: `447377280558`, displayed as `+44 7377 280558`.
- Old WhatsApp/phone digits in `client/src/pages/ServiceArea.jsx`: a LocalBusiness telephone value, call links, visible call text, and a hard-coded WhatsApp URL.
- `Surrey` also occurs in service-area coverage (`client/src/data/serviceAreasCatalog.js`, `client/src/pages/ServiceArea.jsx`) and remains a legitimate service-area label, not an office-address value.
- Git reflogs contain historical commit text about the Wallington address; these are historical records and must remain unchanged.

The implementation audit must rerun the search after edits and report any remaining historical or legitimate service-area references instead of replacing them broadly.

## File Map

- Modify `client/src/config/site.js`: canonical address, map URL, WhatsApp display number and URL number.
- Modify `client/src/config/seoSchemas.js`: consume canonical address and preserve the existing landline as schema telephone.
- Modify `client/src/components/CompanyAddress.jsx`: continue rendering canonical address lines and canonical map URL.
- Modify `client/src/components/Navbar.jsx`: exact seven-link order, remove desktop phone/quote controls, remove mobile Guides/quote item, preserve mobile call icon and sticky Call/Quote bar, increase only desktop link type.
- Modify WhatsApp consumers (`client/src/components/Footer.jsx`, `client/src/components/TrustSection.jsx`, `client/src/pages/Contact.jsx`, `client/src/pages/ServiceDetail.jsx`, `client/src/pages/CustomerDashboard.jsx`, `client/src/pages/ServiceArea.jsx`) to use shared helper/constants and required external-link attributes where anchors are present.
- Modify `client/src/data/websiteContent.js`, `client/src/pages/About.jsx`, and any other active frontend contact consumers found by the audit to use shared constants without changing service-area claims.
- Add `server/src/config/contact.js`: backend-safe contact constants for address, display WhatsApp number, WhatsApp URL, existing landline, and email address; no secrets.
- Modify `server/src/utils/emailService.js`: import backend contact constants and use them in brand config, email footer, confirmations, notifications, and any WhatsApp instructions.
- Modify `server/.env.example` and `docs/EMAIL.md`: document the new exact address without changing secret values.
- Modify/add focused tests: `client/src/config/seoSchemas.test.js`, a new `client/src/components/Navbar.test.jsx` if the existing test setup can render the shared contexts, and a focused contact helper test if needed.
- Create browser evidence files outside source code or in the ignored visual-companion directory only; do not add screenshots or generated output to the application bundle.

### Task 1: Capture Baseline and Record Audit

**Files:**
- Read-only: repository files and active configuration.
- Browser evidence: visual companion session output, not committed application code.

- [ ] **Step 1: Start the frontend dev server and confirm the current route loads.**

Run:

```bash
cd client && npm run dev -- --host 127.0.0.1
```

Expected: Vite reports a local URL, normally `http://localhost:5173/`.

- [ ] **Step 2: Capture before states at 1440px, 768px, 390px, and 375px.**

For each width, capture the homepage header in closed state. At 390px and 375px also capture the expanded mobile menu. Record whether the old phone box, Guides, quote CTA, ordering, logo alignment, wrapping, sticky CTA, and hero overlap are present.

- [ ] **Step 3: Save the audit output.**

Run:

```bash
rg -n -i --hidden --glob '!client/node_modules/**' --glob '!server/node_modules/**' --glob '!client/dist/**' --glob '!server/dist/**' --glob '!*.lock' '91 Manor Road|Wallington|SM6 0AP|447377280558|7377 280558|Guides|Get a Free Quote' .
```

Expected: results match the findings above plus any newly discovered active references. Classify each result as active, legitimate service-area content, historical record, generated/ignored output, or unrelated third-party content before editing.

### Task 2: Add Failing Contact and Schema Tests

**Files:**
- Modify: `client/src/config/seoSchemas.test.js`
- Create: `client/src/components/Navbar.test.jsx` if render setup supports it
- Test: the shared frontend contact constants and rendered nav

- [ ] **Step 1: Add schema assertions for the canonical address and existing landline.**

Add assertions equivalent to:

```js
const schema = buildLocalBusinessSchema();
expect(schema.address).toMatchObject({
  streetAddress: "Tylers House, Tylers Avenue",
  addressLocality: "Southend-on-Sea",
  postalCode: "SS1 2BB",
  addressRegion: "England",
  addressCountry: "GB",
});
expect(schema.telephone).toBe("+442035356331");
```

- [ ] **Step 2: Add navbar rendering assertions for the seven-link order and removals.**

Render `Navbar` with the existing router/auth/announcement providers used by the test setup. Assert the desktop/mobile shared labels occur in this sequence: `Home`, `Services`, `Areas`, `Reviews`, `About`, `FAQ`, `Contact`; assert `Guides` and `Get a Free Quote` are not in the navigation/menu. Keep assertions for the mobile sticky `Get a Quote` bar separate so the test proves that conversion CTA remains outside the menu.

- [ ] **Step 3: Run the focused tests and confirm they fail before implementation.**

Run:

```bash
cd client && npx vitest run src/config/seoSchemas.test.js src/components/Navbar.test.jsx --environment jsdom
```

Expected: FAIL only on the new old-data/order/removal assertions.

### Task 3: Update Canonical Frontend Contact Data

**Files:**
- Modify: `client/src/config/site.js`
- Modify: `client/src/config/seoSchemas.js`
- Modify: `client/src/components/CompanyAddress.jsx` only if needed for exact display/accessibility

- [ ] **Step 1: Set the canonical constants.**

Use these values in `site.js`:

```js
export const WHATSAPP_NUMBER = "447343118167";
export const WHATSAPP_DISPLAY = "07343 118167";
export const COMPANY_ADDRESS_LINE1 = "Tylers House, Tylers Avenue";
export const COMPANY_ADDRESS_LINE2 = "Southend-on-Sea, England, SS1 2BB";
export const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Tylers+House,+Tylers+Avenue,+Southend-on-Sea,+England,+SS1+2BB";
```

Keep `whatsappHref(text)` and its `encodeURIComponent` behavior; it must produce a URL beginning `https://wa.me/447343118167` and preserve optional prefilled text safely.

- [ ] **Step 2: Make `seoSchemas.js` consume the shared address and landline constants.**

Import `COMPANY_ADDRESS_LINE1`, `COMPANY_ADDRESS_LINE2`, `PHONE_MAIN_TEL`, and use:

```js
const BUSINESS_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: COMPANY_ADDRESS_LINE1,
  addressLocality: "Southend-on-Sea",
  postalCode: "SS1 2BB",
  addressRegion: "England",
  addressCountry: "GB",
};
const BUSINESS_PHONE = PHONE_MAIN_TEL;
```

Do not put the WhatsApp number in `telephone` or replace the landline.

- [ ] **Step 3: Run the focused schema/contact tests.**

Run:

```bash
cd client && npx vitest run src/config/seoSchemas.test.js --environment jsdom
```

Expected: PASS for canonical address, postcode, and landline schema values.

### Task 4: Refactor WhatsApp Consumers and Active Frontend Contact Content

**Files:**
- Modify: `client/src/components/Footer.jsx`
- Modify: `client/src/components/TrustSection.jsx`
- Modify: `client/src/pages/Contact.jsx`
- Modify: `client/src/pages/ServiceDetail.jsx`
- Modify: `client/src/pages/CustomerDashboard.jsx`
- Modify: `client/src/pages/ServiceArea.jsx`
- Modify: `client/src/data/websiteContent.js`
- Modify: `client/src/pages/About.jsx`
- Any additional active files found by the Task 1 audit

- [ ] **Step 1: Replace hard-coded WhatsApp URLs and incorrect area-page phone values.**

Use `whatsappHref(message)` for WhatsApp links. Use `PHONE_MAIN_HREF`, `PHONE_MAIN_DISPLAY`, or `PHONE_MAIN_TEL` for telephone/schema fields. In `ServiceArea.jsx`, remove the old WhatsApp digits from both the telephone schema/UI call links and replace the hard-coded WhatsApp anchor with `whatsappHref(...)`; do not use WhatsApp as a business telephone.

- [ ] **Step 2: Apply required external-link accessibility attributes.**

For each external WhatsApp anchor, use:

```jsx
<a
  href={whatsappHref(message)}
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Contact Apex Five Cleaning on WhatsApp"
>
```

Keep button-triggered `window.open` referral behavior safe with its existing `noopener,noreferrer` feature string and use the shared helper.

- [ ] **Step 3: Verify full address composition remains exact.**

Keep `CompanyAddress` as a two-line visual component, but ensure its combined visible text is exactly `Tylers House, Tylers Avenue, Southend-on-Sea, England, SS1 2BB`. Keep compact service-area labels and broader Kent/London/Essex coverage unchanged unless the audit proves they are office-address data.

- [ ] **Step 4: Run contact-adjacent tests.**

Run:

```bash
cd client && npx vitest run src/components/Footer.test.jsx src/components/SEO.test.jsx src/config/seoSchemas.test.js src/components/Navbar.test.jsx --environment jsdom
```

Expected: PASS, with any pre-existing unrelated failures recorded rather than repaired in this scope.

### Task 5: Update Backend Email Configuration and Documentation

**Files:**
- Create: `server/src/config/contact.js`
- Modify: `server/src/utils/emailService.js`
- Modify: `server/.env.example`
- Modify: `server/.env` only if it contains an active old `COMPANY_ADDRESS` override; preserve every secret and unrelated variable.
- Modify: `docs/EMAIL.md`
- Any active backend template/controller/notification files found by the audit

- [ ] **Step 1: Add backend-safe contact constants.**

Create exports for the existing landline, canonical address lines/full address, visible WhatsApp number, and canonical WhatsApp URL. Do not include MongoDB, JWT, email credentials, or other secrets.

- [ ] **Step 2: Make email brand configuration consume those constants.**

Replace the hard-coded old address lines and fallback HTML in `getBrandConfig()` with backend constants, while retaining environment overrides for non-secret company settings. Add WhatsApp display/link fields to the brand config only where templates already provide WhatsApp instructions; do not duplicate literals across email templates.

- [ ] **Step 3: Update active environment/documentation defaults.**

Set `.env.example` and `docs/EMAIL.md` to the exact full address with `SS1 2BB`; if the real `server/.env` contains an old active `COMPANY_ADDRESS`, update only that value while preserving newline escaping, secrets, and unrelated variables. Update any active email signatures, admin notifications, customer confirmations, booking messages, SMS/webhook payloads, or API responses discovered by the second audit.

- [ ] **Step 4: Run backend syntax, build, and tests.**

Run:

```bash
cd server && npm test
cd server && npm run build
```

Expected: existing backend tests pass and `node --check src/index.js` succeeds. If no backend tests exist, report that explicitly while retaining the build result.

### Task 6: Simplify and Tune the Shared Navbar

**Files:**
- Modify: `client/src/components/Navbar.jsx`
- Modify: `client/src/components/Navbar.test.jsx`

- [ ] **Step 1: Set the single ordered nav list.**

Replace the current list with exactly:

```js
const navLinks = [
  { path: "/", label: "Home" },
  { path: "/services", label: "Services" },
  { path: "/service-areas", label: "Areas" },
  { path: "/testimonials", label: "Reviews" },
  { path: "/about", label: "About" },
  { path: "/faq", label: "FAQ" },
  { path: "/contact", label: "Contact" },
];
```

- [ ] **Step 2: Remove only navbar phone and quote controls.**

Delete the desktop phone-number anchor and desktop `Get a Free Quote` link. Leave account/person and search controls in their current right-side group. Remove the mobile menu’s Guides-derived entry and its quote link, but retain the mobile header phone icon and separate sticky Call Now/Get a Quote bar.

- [ ] **Step 3: Increase desktop link text by one compact type step.**

Change only the desktop `navLinkClass` text size from `text-sm` to `text-base` or the repository’s equivalent one-step compact size, then adjust `gap-7` locally only if browser comparison shows wrapping or imbalance. Keep mobile menu links at `text-base`, minimum 44px controls, safe-area sticky CTA positioning, and existing focus/hover classes.

- [ ] **Step 4: Run navbar tests.**

Run:

```bash
cd client && npx vitest run src/components/Navbar.test.jsx --environment jsdom
```

Expected: PASS with the exact order, no Guides/desktop quote CTA in the nav, and preserved sticky quote action.

### Task 7: Browser Before/After Validation and Responsive Refinement

**Files:**
- Read/modify only: `client/src/components/Navbar.jsx` and adjacent navbar CSS/classes if a measured visual issue requires it.
- Browser evidence: before/after screenshots or snapshots, not committed source output.

- [ ] **Step 1: Load the updated app in the browser.**

Use the existing dev server URL and navigate to the homepage. If the server is unavailable, start `cd client && npm run dev -- --host 127.0.0.1`.

- [ ] **Step 2: Capture after states at the four required widths.**

Capture 1440px and 768px desktop/tablet closed headers, and 390px and 375px mobile closed headers plus expanded menus. Compare against Task 1 baseline.

- [ ] **Step 3: Check concrete visual criteria.**

Confirm:

- logo remains left-aligned;
- desktop nav order is Home, Services, Areas, Reviews, About, FAQ, Contact;
- About is directly after Reviews;
- no desktop phone box, Guides, or navbar quote button remains;
- desktop text is slightly larger but stays on one line at 1440px and normal laptop widths;
- mobile menu has the same seven-link order and no Guides/quote menu item;
- mobile call icon and sticky Call/Quote bar remain separate and usable;
- no menu, hero, WhatsApp floating control, or sticky CTA overlap/clip;
- all interactive controls are at least 44px where practical;
- footer still exposes the working Guides link.

- [ ] **Step 4: Make at most one local spacing refinement if needed, then repeat all four widths.**

Only adjust navbar gap/container/right-side spacing to resolve a measured wrap, imbalance, or collision. Do not alter unrelated page sections.

### Task 8: Full Repository Audit and Validation Report

**Files:**
- Read-only search across repository.
- Modify only active files if a contact/nav reference escaped the earlier tasks.

- [ ] **Step 1: Search for outdated address and WhatsApp values.**

Run:

```bash
rg -n -i --hidden --glob '!client/node_modules/**' --glob '!server/node_modules/**' --glob '!client/dist/**' --glob '!server/dist/**' --glob '!*.lock' '91 Manor Road|Wallington|SM6 0AP|447377280558|7377 280558|\+44 7377 280558' .
```

Expected: no active application/template/configuration/metadata/documentation matches. Report any remaining matches as legitimate service-area content or intentionally retained historical records, especially git reflogs.

- [ ] **Step 2: Search navigation and quote safety.**

Run:

```bash
rg -n --glob '!client/node_modules/**' --glob '!client/dist/**' 'label: "Guides"|label: "Get a Quote"|Get a Free Quote|/blog|/request-a-quote' client/src/components/Navbar.jsx client/src/components/Footer.jsx client/src/pages client/src/components
```

Expected: no Guides or quote CTA in `Navbar.jsx`; footer Guides/blog link and quote CTAs outside the navbar remain.

- [ ] **Step 3: Confirm canonical values and link attributes.**

Run:

```bash
rg -n 'Tylers House|SS1 2BB|07343 118167|447343118167|wa\.me/447343118167|Contact Apex Five Cleaning on WhatsApp' client server database docs README.md DEVELOPMENT.md SETUP_COMPLETE.md .instructions.md
```

Expected: canonical values appear in the shared config and all required active consumers; WhatsApp deep links contain no spaces.

- [ ] **Step 4: Run all configured validation commands.**

Run:

```bash
(cd client && npm test)
(cd client && npm run build)
(cd client && npm run lint)
(cd server && npm test)
(cd server && npm run build)
```

Expected: tests/builds pass. `npm run lint` may report that no lint script is configured; record the exact result. No type-check script exists in either package, so record type-check as “not configured” and rely on build/test validation.

- [ ] **Step 5: Produce the final validation report.**

Include a concise file-by-file summary, four-width before/after results, desktop/mobile order confirmation, footer Guides confirmation, quote CTA safety confirmation, existing landline confirmation, canonical WhatsApp URL confirmation, search results including intentional historical references, and every command plus outcome. Do not claim a check passed unless its command or browser observation produced evidence.

### Task 9: Commit Implementation Changes

**Files:** all active files changed by Tasks 2-8; exclude screenshots, generated output, lockfiles, dependencies, and unrelated files.

- [ ] **Step 1: Review the diff and status.**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff -- client/src/components/Navbar.jsx client/src/config/site.js client/src/config/seoSchemas.js server/src/config/contact.js server/src/utils/emailService.js
```

Expected: only approved contact, email, metadata, navigation, focused test, documentation, and backend config changes appear.

- [ ] **Step 2: Commit the scoped implementation.**

Run:

```bash
git add <the exact active files shown by git status after the diff review>
git commit -m "feat: update contact details and navigation"
```

Expected: one scoped implementation commit, with no changes to git history, lockfiles, dependencies, generated output, or unrelated third-party content. Do not stage unrelated pre-existing changes in files that were not part of this plan.
