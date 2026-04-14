import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import SEO from "./SEO";

describe("SEO", () => {
  it("renders page title and canonical URL tags", async () => {
    render(
      <HelmetProvider>
        <SEO
          title="Test Title"
          description="Test description"
          path="/test-page"
        />
      </HelmetProvider>,
    );

    await waitFor(() =>
      expect(document.title).toContain("Test Title"),
    );
    await waitFor(() =>
      expect(
        document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      ).toBe("https://www.apexfivecleaning.co.uk/test-page"),
    );
  });
});
