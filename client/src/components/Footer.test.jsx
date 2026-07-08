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

    expect(screen.getByTitle("Facebook").getAttribute("href")).toBe(
      "https://www.facebook.com/people/Apex-Five-Cleaning-Services/61590339615849/",
    );
    expect(screen.getByTitle("Instagram").getAttribute("href")).toBe(
      "https://www.instagram.com/apex.fivecleaning/",
    );
    expect(screen.getByTitle("TikTok").getAttribute("href")).toBe(
      "https://www.tiktok.com/@apex_fivecleaningservice",
    );
    expect(screen.queryByTitle("X (Twitter)")).toBeNull();
  });
});
