// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import Testimonials from "./Testimonials";

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

it("preserves reviews and unique page metadata while adding the project gallery below them", async () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Testimonials />
      </MemoryRouter>
    </HelmetProvider>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "Loved by Thousands" })).toBeTruthy();
  expect(screen.getByText("4.9 / 5 Stars (200+ Reviews)")).toBeTruthy();
  expect(screen.getByRole("heading", { level: 2, name: "Before & After: Real Cleaning Results" })).toBeTruthy();
  expect(screen.getByText("Real before-and-after projects are being added shortly.")).toBeTruthy();
  await waitFor(() => expect(document.title).toBe("Cleaning Reviews in Essex, Kent & London | Apex Five Cleaning"));
});