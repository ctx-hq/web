import { describe, it, expect } from "vitest";

// Test owner link logic (pure function, no JSX runtime needed)
describe("owner-link", () => {
  function buildOwnerHref(slug?: string | null): string | null {
    if (!slug) return null;
    return `/@${encodeURIComponent(slug)}`;
  }

  function buildOwnerLabel(slug?: string | null): string | null {
    if (!slug) return null;
    return `@${slug}`;
  }

  it("renders correct href for a slug", () => {
    expect(buildOwnerHref("hong")).toBe("/@hong");
  });

  it("renders correct label for a slug", () => {
    expect(buildOwnerLabel("hong")).toBe("@hong");
  });

  it("encodes special characters in slug", () => {
    expect(buildOwnerHref("my org")).toBe("/@my%20org");
  });

  it("returns null for null slug", () => {
    expect(buildOwnerHref(null)).toBeNull();
    expect(buildOwnerLabel(null)).toBeNull();
  });

  it("returns null for undefined slug", () => {
    expect(buildOwnerHref(undefined)).toBeNull();
    expect(buildOwnerLabel(undefined)).toBeNull();
  });

  it("returns null for empty string slug", () => {
    expect(buildOwnerHref("")).toBeNull();
    expect(buildOwnerLabel("")).toBeNull();
  });
});
