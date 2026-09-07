import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import QuoteStarter from "./QuoteStarter";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="current-path">{location.pathname}</p>;
}

function renderStarter() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <QuoteStarter serviceType="domestic-cleaning" />
              <LocationProbe />
            </>
          }
        />
        <Route path="/request-a-quote" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("QuoteStarter", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("stores service and postcode intent before navigating to the quote page", () => {
    renderStarter();

    fireEvent.change(screen.getByLabelText(/postcode/i), {
      target: { value: "sw11 6du" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get my free quote/i }));

    expect(screen.getByTestId("current-path").textContent).toBe("/request-a-quote");
    expect(JSON.parse(sessionStorage.getItem("apexQuotePrefill"))).toMatchObject({
      serviceType: "residential",
      postcode: "SW11 6DU",
    });
  });

  it("keeps visitors on the current page when the postcode is empty", () => {
    renderStarter();

    fireEvent.click(screen.getByRole("button", { name: /get my free quote/i }));

    expect(screen.getByTestId("current-path").textContent).toBe("/");
    expect(screen.getByText(/enter your postcode/i)).toBeTruthy();
    expect(sessionStorage.getItem("apexQuotePrefill")).toBeNull();
  });
});
