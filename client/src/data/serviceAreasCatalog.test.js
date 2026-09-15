import { describe, expect, it } from "vitest";
import {
  APPROVED_ESSEX_LOCATION_NAMES,
  getServiceAreaRegionsForNav,
} from "./serviceAreasCatalog";

describe("service area catalog", () => {
  it("renders regions in Essex, London, Kent order", () => {
    const regions = getServiceAreaRegionsForNav();

    expect(regions.map((region) => region.name)).toEqual([
      "Essex",
      "London",
      "Kent",
    ]);
  });

  it("renders the approved Essex locations with Southend first and no duplicates", () => {
    const regions = getServiceAreaRegionsForNav();
    const essex = regions.find((region) => region.name === "Essex");
    const names = essex.areas.map((area) => area.name);

    expect(names[0]).toBe("Southend-on-Sea");
    expect(names).toEqual(expect.arrayContaining(APPROVED_ESSEX_LOCATION_NAMES));
    expect(new Set(names).size).toBe(names.length);
  });

  it("does not create links for Essex towns without active detail pages", () => {
    const regions = getServiceAreaRegionsForNav();
    const essex = regions.find((region) => region.name === "Essex");
    const leigh = essex.areas.find((area) => area.name === "Leigh-on-Sea");
    const southend = essex.areas.find((area) => area.name === "Southend-on-Sea");

    expect(leigh.hasDetailPage).toBe(false);
    expect(southend.hasDetailPage).toBe(true);
  });
});