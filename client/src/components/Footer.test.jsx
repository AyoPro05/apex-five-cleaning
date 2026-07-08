import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CookieConsentProvider } from "../context/CookieConsentContext";
import Footer from "./Footer";

describe("Footer", () => {
  it("links to the official social profiles", () => {
    render(
      <MemoryRouter>
        <CookieConsentProvider>
          <Footer />
        </CookieConsentProvider>
      </MemoryRouter>,
    );

    const facebookLink = screen.getByRole("link", { name: /facebook/i });
    const instagramLink = screen.getByRole("link", { name: /instagram/i });
    const tiktokLink = screen.getByRole("link", { name: /tiktok/i });

    expect(facebookLink.getAttribute("href")).toBe(
      "https://www.facebook.com/people/Apex-Five-Cleaning-Services/61590339615849/",
    );
    expect(instagramLink.getAttribute("href")).toBe(
      "https://www.instagram.com/apex.fivecleaning/",
    );
    expect(tiktokLink.getAttribute("href")).toBe(
      "https://www.tiktok.com/@apex_fivecleaningservice",
    );
    expect(facebookLink.textContent).toContain("Facebook");
    expect(instagramLink.textContent).toContain("Instagram");
    expect(tiktokLink.textContent).toContain("TikTok");
    expect(screen.queryByTitle("X (Twitter)")).toBeNull();
  });
});
