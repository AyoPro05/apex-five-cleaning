// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import GoogleReviewCTA from "./GoogleReviewCTA";

afterEach(cleanup);

describe("GoogleReviewCTA", () => {
  it("uses the supplied Google review URL and opens it safely in a new tab", () => {
    const url = "https://www.google.com/maps/place/example/reviews";
    render(<GoogleReviewCTA reviewUrl={url} />);

    const link = screen.getByRole("link", { name: "Leave Us a Google Review" });
    expect(link.getAttribute("href")).toBe(url);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText("Your feedback helps other local customers find a cleaning team they can trust.")).toBeTruthy();
  });

  it("does not render an external link when the URL is missing or untrusted", () => {
    const { rerender } = render(<GoogleReviewCTA reviewUrl="" />);
    expect(screen.queryByRole("link", { name: "Leave Us a Google Review" })).toBeNull();

    rerender(<GoogleReviewCTA reviewUrl="https://not-google.example/reviews" />);
    expect(screen.queryByRole("link", { name: "Leave Us a Google Review" })).toBeNull();
  });
});