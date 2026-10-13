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

  it("does not index a display-only town as an existing area detail page", async () => {
    renderArea("leigh-on-sea");
    await waitFor(() => expect(document.querySelector('meta[name="robots"]')?.content)
      .toBe("noindex, nofollow"));
  });
});
