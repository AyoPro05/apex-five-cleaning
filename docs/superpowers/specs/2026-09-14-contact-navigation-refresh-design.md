# Contact and Navigation Refresh Design

## Scope

Update the active Apex Five Cleaning application, backend outputs, configuration, metadata, automated email content, and repository documentation to use the new business address and WhatsApp contact details. Simplify the shared responsive navbar without changing unrelated page design or conversion sections.

## Canonical Contact Data

`client/src/config/site.js` remains the frontend source of truth for:

- Main telephone: preserve the existing landline and its `tel:` behavior.
- WhatsApp display: `07343 118167`.
- WhatsApp URL number: `447343118167`, emitted by `https://wa.me/447343118167` with optional encoded text.
- Address: `Tylers House, Tylers Avenue, Southend-on-Sea, England, SS1 2BB`.
- Map URL: query the new address.

Existing address and WhatsApp literals in active backend, email, seed/configuration, metadata, and documentation files will be replaced. Git history is not modified.

## Navigation Behavior

`client/src/components/Navbar.jsx` will own a single ordered list shared by desktop and mobile:

1. Home
2. Services
3. Areas
4. Reviews
5. About
6. FAQ
7. Contact

Guides and the quote CTA will be removed from that list and from the mobile menu. The Guides footer link and page remain. Quote actions elsewhere remain, including the mobile sticky Call/Quote bar. The desktop phone box and desktop quote button will be removed; the mobile header call icon and mobile sticky call action remain. The person/account and search controls remain after the seven navigation links.

Desktop link text will increase modestly from the current small size to the next compact design step. Existing flex layout, logo positioning, breakpoints, focus/hover styling, and mobile touch-target sizing remain unless visual validation identifies a local spacing adjustment.

## Contact and Accessibility Behavior

All WhatsApp anchors will use the shared helper or canonical URL, display `07343 118167` where a visible number is shown, include an accessible label such as `Contact Apex Five Cleaning on WhatsApp`, and use `target="_blank"` with `rel="noopener noreferrer"` where appropriate. Telephone links remain tied to the existing landline constants and remain available on contact, footer, quote, and conversion surfaces.

## Metadata and Backend Coverage

Audit and update local-business/contact schemas, address components, map links, page metadata, backend controllers/routes/templates, admin notifications, customer confirmations, booking/quote/contact emails, SMS/webhook payloads, environment defaults, seed data, and documentation. No credentials or secrets will be moved into frontend code.

## Validation

1. Capture the current header at 1440px, 768px, 390px, and 375px before editing.
2. Implement the navbar and contact changes.
3. Capture the same four states after editing, including closed and expanded mobile menu states.
4. Check logo alignment, ordering, spacing, wrapping, overflow, touch targets, hero overlap, sticky CTA collisions, footer Guides link, quote actions, telephone links, and WhatsApp links.
5. Search the repository for old address fragments, old WhatsApp digits, Guides navbar references, and quote navbar references.
6. Run focused client tests for navigation/contact-adjacent components, then the existing client test, lint, and build commands. Run backend checks available in the repository.

## Non-Goals

Do not redesign unrelated sections, delete Guides content, remove quote forms or page CTAs, change the existing main telephone number, or alter git history.
