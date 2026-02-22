# SEO Checklist — Apex Five Cleaning

## Sitemap & robots

- **Sitemap:** `client/public/sitemap.xml` → served at `/sitemap.xml`. Submit in [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster](https://www.bing.com/webmasters).
- **robots.txt:** `client/public/robots.txt` — allows crawlers, disallows `/admin/`, `/api/`, `/.env`.
- **Index Now key:** `client/public/apexfive-indexnow-2024.txt` — for Bing/Yandex instant indexing.

## Verification

- Add Google/Bing meta verification tags to `client/index.html` when you register the property.
- Submit sitemap URL: `https://www.apexfivecleaning.co.uk/sitemap.xml`.

## Optional

- Per-page Open Graph (e.g. react-helmet-async) for blog/services.
- JSON-LD LocalBusiness schema.
- Update sitemap `lastmod` when content changes.
