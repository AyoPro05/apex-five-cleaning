import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { HelmetProvider } from "react-helmet-async";
import SEO from "./SEO";

describe("SEO", () => {
  it("replaces the shipped HTML fallback metadata on a service route", async () => {
    const html = new DOMParser().parseFromString(readFileSync("index.html", "utf8"), "text/html");
    const selectors = 'meta[name="description"], link[rel="canonical"]';
    document.head.querySelectorAll(selectors).forEach((element) => element.remove());
    html.head.querySelectorAll(selectors).forEach((element) =>
      document.head.appendChild(element.cloneNode(true)),
    );
    const { unmount } = render(
      <HelmetProvider>
        <SEO title="End of Tenancy Cleaning Southend-on-Sea"
          description="A local end-of-tenancy quote."
          path="/services/end-of-tenancy-cleaning" />
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(Array.from(document.querySelectorAll('link[rel="canonical"]'))
        .map((link) => link.getAttribute("href")))
        .toEqual(["https://www.apexfivecleaning.co.uk/services/end-of-tenancy-cleaning"]);
      expect(Array.from(document.querySelectorAll('meta[name="description"]'))
        .map((meta) => meta.content)).toEqual(["A local end-of-tenancy quote."]);
    });
    unmount();
  });

  it("renders page title and canonical URL tags", async () => {
    render(
      <HelmetProvider>
        <SEO
          title="Test Title"
          description="Test description"
          path="/test-page"
        />
      </HelmetProvider>,
    );

    await waitFor(() =>
      expect(document.title).toContain("Test Title"),
    );
    await waitFor(() =>
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      ).toBe("https://www.apexfivecleaning.co.uk/test-page"),
    );
  });
});
