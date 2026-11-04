import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ServiceArea from "./ServiceArea";

vi.mock("../components/ServiceAreaMap", () => ({ default: () => null }));

beforeEach(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(cleanup);

function renderArea(slug) {
  render(<HelmetProvider><MemoryRouter initialEntries={[`/service-areas/${slug}`]}>
    <Routes><Route path="/service-areas/:areaSlug" element={<ServiceArea />} /></Routes>
  </MemoryRouter></HelmetProvider>);
}

describe("ServiceArea", () => {
  it.each(["southend-on-sea", "canterbury"])(
    "shows the approved Google reviews with a location-neutral heading in %s",
    (slug) => {
      renderArea(slug);

      const reviews = screen.getByRole("region", { name: "What Our Customers Say" });
      expect(within(reviews).getByRole("heading", {
        level: 2,
        name: "What Our Customers Say",
      })).toBeTruthy();
      for (const author of ["Ashley Hill", "YK Lee", "Everglitz Property"]) {
        expect(within(reviews).getByText(author, { exact: true })).toBeTruthy();
      }
      expect(within(reviews).getAllByRole("img", { name: "5 out of 5 stars" }))
        .toHaveLength(3);
      expect(within(reviews).getAllByRole("link", { name: /review on Google/ }))
        .toHaveLength(3);
    },
  );

  it("removes the fictional quote and location-based customer attribution", () => {
    renderArea("southend-on-sea");

    expect(screen.queryByText(/Exceptional service and attention to detail/)).toBeNull();
    expect(screen.queryByText(/Local .* Customer/)).toBeNull();
    expect(screen.queryByRole("heading", { name: /What Southend-on-Sea Customers Say/ }))
      .toBeNull();
  });

  it("preserves the legacy Axminster URL while using the shared catalogue for current areas", async () => {
    renderArea("axminster");
    expect(screen.getByRole("heading", { level: 1, name: "Cleaning Services in Axminster" })).toBeTruthy();
    await waitFor(() => expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe("https://www.apexfivecleaning.co.uk/service-areas/axminster"));
  });

  it("publishes the area's canonical metadata and links its service to the real office", async () => {
    renderArea("southend-on-sea");
    expect(screen.getByRole("heading", { level: 1, name: "Cleaning Services in Southend-on-Sea" })).toBeTruthy();
    await waitFor(() => expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href"))
      .toBe("https://www.apexfivecleaning.co.uk/service-areas/southend-on-sea"));
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map((script) => JSON.parse(script.textContent));
    expect(schemas.find((schema) => schema["@type"] === "LocalBusiness").address.streetAddress)
      .toBe("Tylers House, Tylers Avenue");
    expect(schemas.find((schema) => schema["@type"] === "Service").provider["@id"])
      .toBe("https://www.apexfivecleaning.co.uk#localbusiness");
    expect(schemas.some((schema) => schema["@type"] === "Review" || schema.aggregateRating))
      .toBe(false);
  });

  it("shows Southend's confirmed service range and local cleaning details", () => {
    renderArea("southend-on-sea");

    expect(screen.getByText("Home, rental-property and workplace cleaning across Southend-on-Sea, Westcliff-on-Sea and Leigh-on-Sea.")).toBeTruthy();
    expect(screen.getByText("Southend-on-Sea, Westcliff-on-Sea and Leigh-on-Sea", { exact: true })).toBeTruthy();
    const hero = screen.getByRole("heading", {
      level: 1,
      name: "Cleaning Services in Southend-on-Sea",
    }).closest("section");
    expect(hero.style.backgroundImage).toContain("/images/services/Southend_Hero.webp");
    expect(screen.getByRole("link", { name: "Call Now" }).getAttribute("href"))
      .toBe("tel:+442035356331");
    expect(screen.getByRole("button", { name: "Get Free Quote" })).toBeTruthy();
    expect(screen.getByRole("link", {
      name: "Contact Apex Five Cleaning on WhatsApp",
    }).getAttribute("href"))
      .toBe("https://wa.me/447343118167?text=Hi%20Apex%20Five%20Cleaning%2C%20I'd%20like%20a%20quote%20for%20services%20in%20Southend-on-Sea");

    const services = [
      "Residential Cleaning",
      "End of Tenancy",
      "Airbnb Turnover",
      "Deep Cleaning",
      "Office Cleaning",
      "Commercial Cleaning",
      "After Builders Cleaning",
      "Carpet and Upholstery Cleaning",
    ];
    for (const service of services) {
      expect(screen.getByRole("heading", { level: 3, name: service })).toBeTruthy();
    }

    expect(screen.getByText(/interior windows, skirting boards, oven, microwave and fridge cleaning/)).toBeTruthy();
    expect(screen.getByText(/cupboard cleaning and organisation/)).toBeTruthy();

    const descriptions = services.map((service) => {
      const heading = screen.getByRole("heading", { level: 3, name: service });
      return heading.parentElement.querySelector("p").textContent;
    });
    expect(new Set(descriptions).size).toBe(services.length);

    for (const service of ["Deep Cleaning", "Office Cleaning", "After Builders Cleaning", "Carpet and Upholstery Cleaning"]) {
      const heading = screen.getByRole("heading", { level: 3, name: service });
      const card = heading.closest("div.bg-white");
      expect(card.querySelector("img")).toBeNull();
      expect(card.querySelector("p").textContent.trim()).not.toBe("");
      expect(card.querySelector("button").textContent).toContain("Learn More");
    }
  });

  it("does not index a display-only town as an existing area detail page", async () => {
    renderArea("leigh-on-sea");
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')?.content)
      .toBe("noindex, nofollow"));
  });
});
