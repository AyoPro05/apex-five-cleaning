import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import Quote from "./Quote";
import { setQuotePrefill } from "../utils/quotePrefill";

beforeEach(() => {
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

vi.mock("../utils/recaptcha", () => ({
  getRecaptchaSiteKey: () => "",
  getRecaptchaToken: vi.fn(async () => ""),
  loadRecaptchaScript: vi.fn(),
}));

function renderQuote() {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/request-a-quote"]}>
        <Quote />
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe("Quote", () => {
  it("retains the postcode and service prefill during StrictMode mount checks", async () => {
    setQuotePrefill({ postcode: "SS1 2BB", serviceType: "end-of-tenancy" });
    render(
      <StrictMode>
        <HelmetProvider>
          <MemoryRouter initialEntries={["/request-a-quote"]}>
            <Quote />
          </MemoryRouter>
        </HelmetProvider>
      </StrictMode>,
    );

    expect(screen.getByLabelText(/what service do you need/i).value).toBe("end-of-tenancy");
    fireEvent.change(screen.getByLabelText(/property type/i), { target: { value: "house" } });
    fireEvent.change(screen.getByLabelText(/bedrooms/i), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText(/bathrooms/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect((await screen.findByLabelText(/postcode/i)).value).toBe("SS1 2BB");
    expect(sessionStorage.getItem("apexQuotePrefill")).toBeNull();
  });

  it("scrolls back to the quote form when the customer moves to the next step", async () => {
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    window.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    globalThis.IntersectionObserver = window.IntersectionObserver;
    window.requestAnimationFrame = (callback) => {
      callback();
      return 1;
    };

    renderQuote();

    fireEvent.change(screen.getByLabelText(/property type/i), {
      target: { value: "house" },
    });
    fireEvent.change(screen.getByLabelText(/bedrooms/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/bathrooms/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/what service do you need/i), {
      target: { value: "residential" },
    });

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await screen.findByText(/your contact details/i);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
