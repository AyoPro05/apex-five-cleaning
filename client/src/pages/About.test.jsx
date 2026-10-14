// @vitest-environment jsdom

import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import About from "./About";

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

it("presents the founder story with the supplied photo, exact trust statement, and quote CTA", () => {
  render(
    <HelmetProvider>
      <MemoryRouter>
        <About />
      </MemoryRouter>
    </HelmetProvider>,
  );

  expect(screen.getByRole("heading", { level: 1, name: "Meet the Person Behind Apex Five Cleaning" })).toBeTruthy();
  const portrait = screen.getByRole("img", {
    name: "Portrait of Ayomide Omolewa, founder of Apex Five Cleaning, in a professional setting",
  });
  expect(portrait.getAttribute("src")).toBe("/images/Professional_Business_Headshot.jpg");
  expect(portrait.getAttribute("width")).toBe("1122");
  expect(portrait.getAttribute("height")).toBe("1402");
  expect(screen.getByText(/everyone deserves a clean environment/i)).toBeTruthy();
  expect(screen.getByText("Apex Five Cleaning exists to make professional cleaning simple, reliable and stress-free — so you always know who is coming into your home, what to expect, and that the job will be done properly.")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Get Your Free Quote" }).getAttribute("href")).toBe("/request-a-quote");
  return waitFor(() => expect(document.title).toBe("About Apex Five | Apex Five Cleaning"));
});