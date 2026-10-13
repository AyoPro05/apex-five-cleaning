// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

const renderHome = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/request-a-quote" element={<p>Quote page</p>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("Home page", () => {
  it("retains the live photo, headline, postcode starter and telephone action", () => {
    renderHome();

    expect(screen.getAllByRole("heading", {
      level: 1,
      name: "More time for life. Less time cleaning.",
    })).toHaveLength(1);
    expect(screen.getByAltText("Apex Five Cleaning team and branded van outside a property").getAttribute("src"))
      .toBe("/images/heroes/Hero_Services.webp");
    expect(screen.getByLabelText("Postcode").getAttribute("autocomplete")).toBe("postal-code");
    expect(screen.getAllByRole("link", { name: "Call 020 3535 6331" })
      .every((link) => link.getAttribute("href") === "tel:+442035356331")).toBe(true);
  });

  it("takes a formatted postcode from the homepage into the existing quote flow", () => {
    renderHome();
    fireEvent.change(screen.getByLabelText("Postcode"), {
      target: { value: "ss12bb" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Get My Free Quote" }));

    expect(screen.getByText("Quote page")).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("apexQuotePrefill"))).toMatchObject({
      postcode: "SS1 2BB",
    });
  });

  it("links visitors and crawlers to the canonical service and local area pages", () => {
    renderHome();
    expect(screen.getByRole("link", { name: /For Tenants, landlords, and letting agents/i }).getAttribute("href"))
      .toBe("/services/end-of-tenancy-cleaning");
    expect(screen.getByRole("link", { name: "Southend-on-Sea" }).getAttribute("href"))
      .toBe("/service-areas/southend-on-sea");
    expect(screen.getByRole("link", { name: "Leigh-on-Sea" }).getAttribute("href"))
      .toBe("/service-areas");
  });

  it("publishes local metadata and structured data that matches the visible FAQs", async () => {
    renderHome();

    await waitFor(() => expect(document.title).toBe(
      "House Cleaning Southend-on-Sea | Apex Five Cleaning",
    ));
    expect(document.querySelector('link[rel="canonical"]').getAttribute("href"))
      .toBe("https://www.apexfivecleaning.co.uk/");
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((script) => JSON.parse(script.textContent));
    expect(schemas.some((schema) => schema["@type"] === "LocalBusiness"
      && schema.address.addressLocality === "Southend-on-Sea")).toBe(true);
    expect(schemas.some((schema) => schema["@type"] === "WebSite")).toBe(true);
    const faqSchema = schemas.find((schema) => schema["@type"] === "FAQPage");
    expect(faqSchema.mainEntity).toHaveLength(3);
    faqSchema.mainEntity.forEach((faq) => {
      expect(screen.getByText(faq.name)).toBeTruthy();
      expect(screen.getByText(faq.acceptedAnswer.text)).toBeTruthy();
    });
  });
});
