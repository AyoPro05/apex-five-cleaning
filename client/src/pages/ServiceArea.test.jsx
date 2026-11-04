import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  });

  it("shows Southend's confirmed service range and local cleaning details", () => {
    renderArea("southend-on-sea");

    expect(screen.getByText("Home, rental-property and workplace cleaning across Southend-on-Sea, Westcliff-on-Sea and Leigh-on-Sea.")).toBeTruthy();
    expect(screen.getByText("Southend-on-Sea, Westcliff-on-Sea and Leigh-on-Sea", { exact: true })).toBeTruthy();

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
