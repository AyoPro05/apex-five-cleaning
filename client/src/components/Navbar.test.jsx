// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AnnouncementProvider } from "../context/AnnouncementContext";
import { AuthProvider } from "../context/AuthContext";
import Navbar from "./Navbar";

const renderNavbar = () =>
  render(
    <MemoryRouter>
      <AnnouncementProvider>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </AnnouncementProvider>
    </MemoryRouter>,
  );

describe("Navbar", () => {
  it("keeps the requested navigation order without Guides or a navbar quote CTA", async () => {
    renderNavbar();

    const navigationLabels = [
      "Home",
      "Services",
      "Areas",
      "Reviews",
      "About",
      "FAQ",
      "Contact",
    ];
    const navigation = screen.getByRole("navigation");
    const links = within(navigation).getAllByRole("link");
    const labels = links.map((link) => link.textContent?.trim()).filter(Boolean);

    expect(labels.slice(0, navigationLabels.length)).toEqual(navigationLabels);
    expect(within(navigation).queryByText("Guides")).toBeNull();
    expect(within(navigation).queryByText("Get a Free Quote")).toBeNull();
    expect(within(navigation).getByRole("link", { name: "Get a Quote" })).toBeTruthy();
  });
});
