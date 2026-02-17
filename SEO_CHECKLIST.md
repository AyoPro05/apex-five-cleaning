# SEO Checklist – Apex Five Cleaning

Use this checklist to ensure proper search engine visibility and indexing.

---

## 1. Google Search Console

- [ ] **Add property**
  - Go to [search.google.com/search-console](https://search.google.com/search-console)
  - Add property → URL prefix: `https://www.apexfivecleaning.co.uk`
  - Verify via HTML tag (add to `<head>` in `client/index.html`):
    ```html
    <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
    ```
- [ ] **Submit sitemap**
  - In Search Console → Sitemaps → Add: `https://www.apexfivecleaning.co.uk/sitemap.xml`
- [ ] **Request indexing**
  - Use URL Inspection tool for important URLs (home, services, quote)
- [ ] **Check coverage**
  - Review Index → Pages for errors or exclusions

---

## 2. Bing Webmaster Tools

- [ ] **Add site**
  - Go to [bing.com/webmasters](https://www.bing.com/webmasters)
  - Add site: `https://www.apexfivecleaning.co.uk`
  - Verify via meta tag or DNS
- [ ] **Submit sitemap**
  - Sitemaps → Add: `https://www.apexfivecleaning.co.uk/sitemap.xml`
- [ ] **Submit URLs** (optional)
  - Use URL Submission for priority pages

---

## 3. Sitemap

- [x] **Sitemap exists** at `/sitemap.xml`
- [x] **robots.txt references sitemap**: `Sitemap: https://www.apexfivecleaning.co.uk/sitemap.xml`
- [ ] **Update lastmod** when content changes
- [ ] **Validate sitemap** at [xml-sitemaps.com/validate-xml-sitemap.html](https://www.xml-sitemaps.com/validate-xml-sitemap.html)

Included URLs: Home, Services, Service Areas, Blog, About, Contact, Quote, Pay Online, Privacy, Terms, and all area/service detail pages.

---

## 4. Open Graph Tags

- [x] **Base OG tags** in `client/index.html`:
  - `og:title`, `og:description`, `og:type`, `og:url`, `og:image`
  - `og:image:width`, `og:image:height`, `og:image:alt`
  - `og:site_name`, `og:locale`
- [x] **Twitter Card** tags for sharing
- [ ] **(Optional)** Per-page OG via `react-helmet-async` for services, blog, areas so shared links show correct title/image

---

## 5. Index Now (Instant Indexing)

Index Now notifies Bing, Yandex, and other supported engines immediately when content changes. Google does *not* support Index Now.

- [x] **Key file** at `https://www.apexfivecleaning.co.uk/apexfive-indexnow-2024.txt`
  - File: `public/apexfive-indexnow-2024.txt` (content = key)
- [ ] **Register key** (optional): [bing.com/indexnow](https://www.bing.com/indexnow) to generate your own
- [ ] **Ping when content changes**
  - For new/updated pages, send GET:  
    `https://api.indexnow.org/indexnow?url=<full-url>&keyLocation=<full-url-to-key-file>&key=<your-key>`
  - Example: `https://api.indexnow.org/indexnow?url=https://www.apexfivecleaning.co.uk/blog/new-post&keyLocation=https://www.apexfivecleaning.co.uk/apexfive-indexnow-2024.txt&key=apexfive-indexnow-2024`

Supported engines: Bing, Yandex, Naver, Seznam.cz, DuckDuckGo (via Bing).

---

## 6. Additional SEO Best Practices

- [x] **Canonical URL**: `https://www.apexfivecleaning.co.uk`
- [x] **Robots meta**: `index, follow` on main pages
- [x] **robots.txt**: Allows crawlers, blocks `/admin/`, `/api/`, `/.env`
- [ ] **Structured data** (optional): Add JSON-LD LocalBusiness schema
- [ ] **Core Web Vitals**: Monitor in Search Console
- [ ] **Mobile usability**: Verify in Search Console

---

## Quick Links

| Tool | URL |
|------|-----|
| Google Search Console | https://search.google.com/search-console |
| Bing Webmaster Tools | https://www.bing.com/webmasters |
| Index Now (Bing) | https://www.bing.com/indexnow |
| Sitemap | https://www.apexfivecleaning.co.uk/sitemap.xml |
| robots.txt | https://www.apexfivecleaning.co.uk/robots.txt |

---

*Last updated: 2026-02-16*
