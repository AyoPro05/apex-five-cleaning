import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";

import Quote from "./Quote";

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

    fireEvent.click(screen.getByRole("button", { name: /click next/i }));

    await screen.findByText(/your contact details/i);
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
