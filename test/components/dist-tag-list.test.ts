import { describe, it, expect } from "vitest";

// Test dist-tag-list logic (pure function extraction, no JSX runtime needed)
describe("dist-tag-list", () => {
  function resolveEntries(tags?: Record<string, string> | null): [string, string][] | null {
    if (!tags) return null;
    const entries = Object.entries(tags);
    if (entries.length === 0) return null;
    return entries;
  }

  it("returns tag->version pairs", () => {
    const entries = resolveEntries({ latest: "1.2.0", beta: "2.0.0-beta.1" });
    expect(entries).toEqual([
      ["latest", "1.2.0"],
      ["beta", "2.0.0-beta.1"],
    ]);
  });

  it("returns single entry", () => {
    const entries = resolveEntries({ latest: "0.1.0" });
    expect(entries).toHaveLength(1);
    expect(entries![0]).toEqual(["latest", "0.1.0"]);
  });

  it("returns null for empty tags object", () => {
    expect(resolveEntries({})).toBeNull();
  });

  it("returns null for null tags", () => {
    expect(resolveEntries(null)).toBeNull();
  });

  it("returns null for undefined tags", () => {
    expect(resolveEntries(undefined)).toBeNull();
  });
});
