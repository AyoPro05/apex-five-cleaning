import { describe, expect, it } from "vitest";
import { buildLocalBusinessSchema } from "./seoSchemas";

describe("buildLocalBusinessSchema", () => {
  it("uses the canonical office address and landline", () => {
    const schema = buildLocalBusinessSchema();

    expect(schema.address).toMatchObject({
      streetAddress: "Tylers House, Tylers Avenue",
      addressLocality: "Southend-on-Sea",
      postalCode: "SS1 2BB",
      addressRegion: "England",
      addressCountry: "GB",
    });
    expect(schema.telephone).toBe("+442035356331");
  });

  it("includes official social profiles in sameAs", () => {
    expect(buildLocalBusinessSchema().sameAs).toEqual([
      "https://www.facebook.com/people/Apex-Five-Cleaning-Services/61590339615849/",
      "https://www.instagram.com/apex.fivecleaning/",
      "https://www.tiktok.com/@apex_fivecleaningservice",
    ]);
  });
});
