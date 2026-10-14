import { describe, expect, it } from "vitest";
import vercelConfig from "../../vercel.json";

describe("static hosting security headers", () => {
  it("sets baseline browser security headers for every page", () => {
    const allPaths = vercelConfig.headers.find((entry) => entry.source === "/(.*)");
    expect(allPaths).toBeTruthy();
    const headers = Object.fromEntries(allPaths.headers.map(({ key, value }) => [key, value]));

    expect(headers["Strict-Transport-Security"]).toMatch(/^max-age=31536000/);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });
});