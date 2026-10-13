import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SERVICE_AREAS_BY_SLUG } from "../data/serviceAreasCatalog";

const sitemap = readFileSync(join(process.cwd(), "public/sitemap.xml"), "utf8");
const sitemapDocument = new DOMParser().parseFromString(sitemap, "application/xml");
const urls = Array.from(sitemapDocument.querySelectorAll("loc")).map((location) => location.textContent);

describe("public sitemap", () => {
  it("publishes valid XML and only existing area detail pages", () => {
    expect(sitemapDocument.querySelector("parsererror")).toBeNull();
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls.filter((url) => url.includes("/service-areas/"))) {
      expect(SERVICE_AREAS_BY_SLUG[new URL(url).pathname.split("/").at(-1)]).toBeDefined();
    }
  });

  it("lists canonical service detail URLs that match React routes", () => {
    expect(urls).toEqual(
      expect.arrayContaining([
        "https://www.apexfivecleaning.co.uk/services/domestic-cleaning",
        "https://www.apexfivecleaning.co.uk/services/deep-cleaning",
        "https://www.apexfivecleaning.co.uk/services/end-of-tenancy-cleaning",
        "https://www.apexfivecleaning.co.uk/services/airbnb-cleaning",
        "https://www.apexfivecleaning.co.uk/services/office-cleaning",
        "https://www.apexfivecleaning.co.uk/services/commercial-cleaning",
        "https://www.apexfivecleaning.co.uk/services/buggy-toy-cleaning",
      ]),
    );
  });

  it("does not publish legacy service aliases as canonical sitemap targets", () => {
    expect(urls).not.toContain("https://www.apexfivecleaning.co.uk/services/residential");
    expect(urls).not.toContain("https://www.apexfivecleaning.co.uk/services/end-of-tenancy");
    expect(urls).not.toContain("https://www.apexfivecleaning.co.uk/services/airbnb");
    expect(urls).not.toContain("https://www.apexfivecleaning.co.uk/services/commercial");
  });

  it("permanently redirects legacy service URLs to indexable sitemap targets", () => {
    const { redirects } = JSON.parse(readFileSync("vercel.json", "utf8"));
    for (const alias of ["residential", "end-of-tenancy", "airbnb", "commercial"]) {
      const redirect = redirects.find((item) => item.source === `/services/${alias}`);
      expect(redirect.permanent).toBe(true);
      expect(urls).toContain(`https://www.apexfivecleaning.co.uk${redirect.destination}`);
    }
  });
});
