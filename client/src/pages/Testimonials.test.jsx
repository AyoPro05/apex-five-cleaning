// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
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

it("preserves reviews and unique page metadata while showing the approved Basildon project below them", async () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Testimonials />
      </MemoryRouter>
    </HelmetProvider>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "Loved by Thousands" })).toBeTruthy();
  expect(screen.getByText("4.9 / 5 Stars (200+ Reviews)")).toBeTruthy();
  const gallery = screen.getByRole("region", { name: "Before & After: Real Cleaning Results" });
  const project = within(gallery).getByRole("article");
  expect(within(project).getByRole("heading", { level: 3, name: "Airbnb Bedroom Cleaning" })).toBeTruthy();
  expect(within(project).getByText(/Airbnb \/ Holiday Let Cleaning.*Basildon/)).toBeTruthy();
  expect(within(project).getByRole("img", { name: "Bedroom at an Airbnb property in Basildon before cleaning" }).getAttribute("src")).toBe("/images/projects/airbnb-bedroom/Airbnb_Bedroom_Before.webp");
  expect(within(project).getByRole("img", { name: "Bedroom at an Airbnb property in Basildon after cleaning" }).getAttribute("src")).toBe("/images/projects/airbnb-bedroom/Airbnb_Bedroom_After.webp");
  expect(within(project).getByText("Before")).toBeTruthy();
  expect(within(project).getByText("After")).toBeTruthy();
  expect(screen.queryByText("Real before-and-after projects are being added shortly.")).toBeNull();
  expect(screen.getByRole("heading", { level: 1, name: "Loved by Thousands" }).compareDocumentPosition(gallery) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await waitFor(() => expect(document.title).toBe("Cleaning Reviews in Essex, Kent & London | Apex Five Cleaning"));
});
