import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import CustomerReviews from "./CustomerReviews";
import { CUSTOMER_REVIEWS } from "../data/customerReviews";

const APPROVED_REVIEWS = [
  {
    authorDisplayName: "Ashley Hill",
    text: "Amazing service,  very professional and helpful , great prices too, did my end of tenancy clean and it was fantastic and went though all checks thanks again",
    rating: 5,
    source: "Google",
    sourceUrl: "https://maps.app.goo.gl/ebj9hASzTbPTcFyA8",
    verified: true,
  },
  {
    authorDisplayName: "YK Lee",
    text: "Brilliant service every time. The cleaners are lovely, trustworthy, and do an amazing job. It’s such a relief coming home to a perfectly clean house.",
    rating: 5,
    source: "Google",
    sourceUrl: "https://maps.app.goo.gl/FcLzzQXisRTUsgha9",
    verified: true,
  },
  {
    authorDisplayName: "Everglitz Property",
    text: `Used Apex Five across 3 properties, post-renovation and end-of-tenancy cleans. Not a small job, and they delivered on all of it.

Kitchens, bathrooms, carpets and windows were all done to a really high standard. The kind of clean where you're actually impressed when you walk in. Renovation dust completely gone, bathrooms spotless, carpets looking far better than expected.

They were quick, professional, easy to communicate with, and the pricing was fair for the level of work. No corners cut, no chasing required.

Would use again without hesitation.`,
    rating: 5,
    source: "Google",
    sourceUrl: "https://maps.app.goo.gl/w67rcA4Y3rUJ5L5G8",
    verified: true,
  },
];

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CustomerReviews", () => {
  it("stores exactly the three owner-approved reviews without changing their wording", () => {
    expect(CUSTOMER_REVIEWS).toHaveLength(3);
    expect(CUSTOMER_REVIEWS).toMatchObject(APPROVED_REVIEWS);
    expect(CUSTOMER_REVIEWS.every((review) => typeof review.id === "string" && review.id.length > 0))
      .toBe(true);
    expect(new Set(CUSTOMER_REVIEWS.map((review) => review.id)).size).toBe(3);
  });

  it("renders each original review with its public name, rating and safe Google link", () => {
    render(<CustomerReviews />);

    const section = screen.getByRole("region", { name: "What Our Customers Say" });
    const figures = within(section).getAllByRole("figure");
    expect(figures).toHaveLength(3);

    APPROVED_REVIEWS.forEach((review, index) => {
      const figure = figures[index];
      expect(figure.querySelector("blockquote").textContent).toBe(review.text);
      expect(within(figure).getByText(review.authorDisplayName, { exact: true })).toBeTruthy();
      const rating = within(figure).getByRole("img", {
        name: `${review.rating} out of 5 stars`,
      });
      expect(rating.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(review.rating);

      const link = within(figure).getByRole("link", {
        name: `Read ${review.authorDisplayName}'s review on Google`,
      });
      expect(link.textContent).toContain("Google");
      expect(link.getAttribute("href")).toBe(review.sourceUrl);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });
    expect(section.querySelector('script[type="application/ld+json"]')).toBeNull();
  });

  it("displays only reviews explicitly marked as verified", () => {
    render(<CustomerReviews reviews={[
      CUSTOMER_REVIEWS[0],
      { ...CUSTOMER_REVIEWS[1], verified: false },
      { ...CUSTOMER_REVIEWS[2], verified: undefined },
    ]} />);

    expect(screen.getAllByRole("figure")).toHaveLength(1);
    expect(screen.getByText("Ashley Hill", { exact: true })).toBeTruthy();
    expect(screen.queryByText("YK Lee", { exact: true })).toBeNull();
    expect(screen.queryByText("Everglitz Property", { exact: true })).toBeNull();
  });

  it.each([
    { label: "empty", reviews: [] },
    { label: "unverified", reviews: CUSTOMER_REVIEWS.map((review) => ({ ...review, verified: false })) },
  ])("renders nothing when the review data is $label", ({ reviews }) => {
    const { container } = render(<CustomerReviews reviews={reviews} />);

    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("heading", { name: "What Our Customers Say" })).toBeNull();
  });

  it("does not display a star rating when no original rating is provided", () => {
    render(<CustomerReviews reviews={[{ ...CUSTOMER_REVIEWS[0], rating: undefined }]} />);

    expect(screen.getByText("Ashley Hill", { exact: true })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /out of 5 stars/ })).toBeNull();
  });
});
