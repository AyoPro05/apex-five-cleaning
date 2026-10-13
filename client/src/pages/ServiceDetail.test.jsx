// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ServiceDetail from "./ServiceDetail";

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

beforeEach(() => {
  class IntersectionObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  global.IntersectionObserver = IntersectionObserverMock;
});

const renderServiceDetail = (path = "/services/end-of-tenancy-cleaning") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/services/:serviceId" element={<ServiceDetail />} />
          <Route path="/request-a-quote" element={<p>Quote page</p>} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("ServiceDetail", () => {
  it("uses the canonical service slug and local end-of-tenancy search metadata", async () => {
    renderServiceDetail();

    await waitFor(() =>
      expect(document.title).toBe(
        "End of Tenancy Cleaning Southend-on-Sea | Apex Five Cleaning",
      ),
    );
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    ).toBe("https://www.apexfivecleaning.co.uk/services/end-of-tenancy-cleaning");
    expect(
      document.querySelector('meta[name="description"]')?.getAttribute("content"),
    ).toContain("landlords, tenants and letting agents in Southend-on-Sea");
  });

  it("publishes cleaning service and FAQ structured data for the end-of-tenancy page", async () => {
    renderServiceDetail();

    await waitFor(() =>
      expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBeGreaterThan(0),
    );
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((script) =>
      JSON.parse(script.textContent),
    );

    expect(
      schemas.some(
        (schema) =>
          schema["@type"] === "Service" &&
          schema.serviceType === "End of Tenancy Cleaning" &&
          schema.areaServed.some((area) => area.name === "Southend-on-Sea"),
      ),
    ).toBe(true);
    expect(
      schemas.some(
        (schema) =>
          schema["@type"] === "FAQPage" &&
          schema.mainEntity.some((faq) => faq.name === "Can landlords or agents book directly?"),
      ),
    ).toBe(true);
  });

  it("sets quote intent when the end-of-tenancy quote CTA is clicked", () => {
    renderServiceDetail();

    fireEvent.click(screen.getAllByRole("link", { name: /get an end of tenancy quote/i })[0]);

    expect(screen.getByText("Quote page")).toBeTruthy();
    expect(JSON.parse(sessionStorage.getItem("apexQuotePrefill"))).toMatchObject({
      serviceType: "end-of-tenancy",
    });
  });

  it("does not publish domestic cleaning content for an unknown service URL", async () => {
    renderServiceDetail("/services/does-not-exist");

    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeTruthy();
    expect(screen.queryByRole("heading", { level: 1, name: "Domestic Cleaning" })).toBeNull();
    await waitFor(() => expect(document.querySelector('meta[name="robots"]').content)
      .toBe("noindex, nofollow"));
  });
});
