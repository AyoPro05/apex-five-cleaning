// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TrustSection from "./TrustSection";

globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("TrustSection", () => {
  it("shows WhatsApp Us without exposing the phone number", () => {
    render(<TrustSection />);

    const whatsappLink = screen.getByRole("link", { name: /whatsapp/i });

    expect(whatsappLink.textContent).toContain("WhatsApp Us");
    expect(whatsappLink.textContent).not.toContain("07343 118167");
    expect(whatsappLink.getAttribute("href")).toContain(
      "https://wa.me/447343118167",
    );
  });
});