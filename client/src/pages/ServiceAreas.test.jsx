// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ServiceAreas from "./ServiceAreas";

vi.mock("../components/ServiceAreaMap", () => ({
  default: () => <div aria-label="Service map" />,
}));

afterEach(cleanup);
vi.stubGlobal(
  "IntersectionObserver",
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);
afterEach(() => vi.unstubAllGlobals());

it("lists Wallington under London and renders a unique page title", async () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <ServiceAreas />
      </MemoryRouter>
    </HelmetProvider>,
  );

  const london = screen.getByRole("heading", { level: 2, name: "London" });
  expect(london.parentElement.textContent).toContain("Wallington");
  expect(screen.getByText("Wallington", { exact: true }).closest("a, button")).toBeNull();
  await waitFor(() => expect(document.title).toBe("Cleaning Services Across Essex, London & Kent | Apex Five Cleaning"));
});