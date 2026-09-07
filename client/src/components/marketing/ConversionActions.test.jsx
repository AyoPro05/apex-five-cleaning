import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import ConversionActions from "./ConversionActions";
import { PHONE_MAIN_HREF } from "../../config/site";

describe("ConversionActions", () => {
  it("renders quote and call actions with accessible labels", () => {
    render(
      <MemoryRouter>
        <ConversionActions quoteLabel="Get a Free Quote" callLabel="Call Now" />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /get a free quote/i }).getAttribute("href")).toBe(
      "/request-a-quote",
    );
    expect(screen.getByRole("link", { name: /call now/i }).getAttribute("href")).toBe(
      PHONE_MAIN_HREF,
    );
  });
});
