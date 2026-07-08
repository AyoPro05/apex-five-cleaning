import { describe, expect, it } from "vitest";
import { buildLocalBusinessSchema } from "./seoSchemas";

describe("buildLocalBusinessSchema", () => {
  it("includes official social profiles in sameAs", () => {
    expect(buildLocalBusinessSchema().sameAs).toEqual([
      "https://www.facebook.com/people/Apex-Five-Cleaning-Services/61590339615849/",
      "https://www.instagram.com/apex.fivecleaning/",
      "https://www.tiktok.com/@apex_fivecleaningservice",
    ]);
  });
});
