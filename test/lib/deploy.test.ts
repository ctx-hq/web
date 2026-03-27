import { describe, it, expect } from "vitest";
import { ROUTES_CONFIG } from "../../src/lib/deploy";

describe("ROUTES_CONFIG", () => {
  it("has version 1", () => {
    expect(ROUTES_CONFIG.version).toBe(1);
  });

  it("includes a catch-all route", () => {
    expect(ROUTES_CONFIG.include).toContain("/*");
  });

  it("excludes static assets from the worker", () => {
    expect(ROUTES_CONFIG.exclude).toContain("/static/*");
  });

  it("excludes common root-level static files", () => {
    expect(ROUTES_CONFIG.exclude).toContain("/favicon.svg");
    expect(ROUTES_CONFIG.exclude).toContain("/robots.txt");
  });

  it("produces valid JSON for _routes.json", () => {
    const json = JSON.stringify(ROUTES_CONFIG);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual({
      version: 1,
      include: ["/*"],
      exclude: ["/favicon.svg", "/robots.txt", "/static/*"],
    });
  });
});
