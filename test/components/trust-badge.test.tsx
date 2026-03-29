import { describe, it, expect } from "vitest";
import type { TrustTier } from "../../src/lib/types";
import { TRUST_TIERS } from "../../src/lib/constants";

// Test trust badge logic (pure function, no JSX runtime needed)
describe("trust-badge", () => {
  function resolveBadge(tier?: TrustTier | null): { label: string; icon: string; color: string } | null {
    if (!tier || tier === "unverified") return null;
    const config = TRUST_TIERS[tier];
    if (!config) return null;
    return config;
  }

  it("returns null for unverified tier", () => {
    expect(resolveBadge("unverified")).toBeNull();
  });

  it("returns null for null/undefined tier", () => {
    expect(resolveBadge(null)).toBeNull();
    expect(resolveBadge(undefined)).toBeNull();
  });

  it("renders structural tier correctly", () => {
    const result = resolveBadge("structural");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Structural");
    expect(result!.icon).toBe("✓");
    expect(result!.color).toContain("yellow");
  });

  it("renders source_linked tier correctly", () => {
    const result = resolveBadge("source_linked");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Source Linked");
    expect(result!.color).toContain("blue");
  });

  it("renders reviewed tier correctly", () => {
    const result = resolveBadge("reviewed");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Reviewed");
    expect(result!.color).toContain("green");
  });

  it("renders verified tier correctly", () => {
    const result = resolveBadge("verified");
    expect(result).not.toBeNull();
    expect(result!.label).toBe("Verified");
    expect(result!.color).toContain("emerald");
  });

  it("all 5 tiers are defined in TRUST_TIERS", () => {
    const tiers: TrustTier[] = ["unverified", "structural", "source_linked", "reviewed", "verified"];
    for (const tier of tiers) {
      expect(TRUST_TIERS[tier]).toBeDefined();
    }
  });

  it("each non-unverified tier produces a distinct label", () => {
    const tiers: TrustTier[] = ["structural", "source_linked", "reviewed", "verified"];
    const labels = tiers.map((t) => resolveBadge(t)!.label);
    expect(new Set(labels).size).toBe(4);
  });
});
