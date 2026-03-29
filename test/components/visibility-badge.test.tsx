import { describe, it, expect } from "vitest";
import type { Visibility } from "../../src/lib/types";
import { VISIBILITY_CONFIG } from "../../src/lib/constants";

// Test visibility badge logic (pure function, no JSX runtime needed)
describe("visibility-badge", () => {
  function resolveVisibility(visibility?: Visibility | null): { label: string; icon: string } | null {
    if (!visibility || visibility === "public") return null;
    const config = VISIBILITY_CONFIG[visibility];
    if (!config) return null;
    return config;
  }

  it("returns null for public visibility (not shown)", () => {
    expect(resolveVisibility("public")).toBeNull();
  });

  it("returns null for null/undefined visibility", () => {
    expect(resolveVisibility(null)).toBeNull();
    expect(resolveVisibility(undefined)).toBeNull();
  });

  it("renders unlisted badge", () => {
    const result = resolveVisibility("unlisted");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Unlisted");
    expect(result!.icon).toBe("\u{1F517}");
  });

  it("renders private badge", () => {
    const result = resolveVisibility("private");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Private");
    expect(result!.icon).toBe("\u{1F512}");
  });

  it("all 3 visibilities are defined in VISIBILITY_CONFIG", () => {
    const visibilities: Visibility[] = ["public", "unlisted", "private"];
    for (const v of visibilities) {
      expect(VISIBILITY_CONFIG[v]).toBeDefined();
    }
  });
});
