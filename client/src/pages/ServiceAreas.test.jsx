// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function CurrentPath() {
  const { pathname } = useLocation();
  return <output data-testid="current-path">{pathname}</output>;
}

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

it("renders Southend-on-Sea as a crawlable link to its detail page", () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <CurrentPath />
        <ServiceAreas />
      </MemoryRouter>
    </HelmetProvider>,
  );

  const southendLink = screen.getByRole("link", { name: /Southend-on-Sea/ });
  expect(southendLink.tagName).toBe("A");
  expect(southendLink.getAttribute("href")).toBe("/service-areas/southend-on-sea");
  expect(southendLink.classList.contains("focus-visible:ring-2")).toBe(true);
  expect(southendLink.tabIndex).toBe(0);
  expect(southendLink.querySelector("a")).toBeNull();
  southendLink.focus();
  expect(document.activeElement).toBe(southendLink);

  const detailCards = screen.getAllByText("Learn More →");
  expect(detailCards.length).toBeGreaterThan(0);
  for (const learnMore of detailCards) {
    const card = learnMore.closest("a");
    expect(card).not.toBeNull();
    expect(card.getAttribute("href")).toMatch(/^\/service-areas\/.+/);
  }

  fireEvent.click(southendLink);
  expect(screen.getByTestId("current-path").textContent).toBe("/service-areas/southend-on-sea");
});

it("keeps areas without detail pages noninteractive", () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <ServiceAreas />
      </MemoryRouter>
    </HelmetProvider>,
  );

  const leighHeading = screen.getByRole("heading", { level: 3, name: "Leigh-on-Sea" });
  const leighCard = leighHeading.parentElement.parentElement;
  expect(leighCard.tagName).toBe("DIV");
  expect(leighCard.hasAttribute("href")).toBe(false);
  expect(leighCard.hasAttribute("onclick")).toBe(false);
  expect(leighCard.classList.contains("cursor-pointer")).toBe(false);
});