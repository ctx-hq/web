import { describe, it, expect } from "vitest";

// Test publisher link logic (pure function, no JSX runtime needed)
describe("publisher-link", () => {
  function buildPublisherHref(slug?: string | null): string | null {
    if (!slug) return null;
    return `/publisher/${encodeURIComponent(slug)}`;
  }

  function buildPublisherLabel(slug?: string | null): string | null {
    if (!slug) return null;
    return `@${slug}`;
  }

  it("renders correct href for a slug", () => {
    expect(buildPublisherHref("hong")).toBe("/publisher/hong");
  });

  it("renders correct label for a slug", () => {
    expect(buildPublisherLabel("hong")).toBe("@hong");
  });

  it("encodes special characters in slug", () => {
    expect(buildPublisherHref("my org")).toBe("/publisher/my%20org");
  });

  it("returns null for null slug", () => {
    expect(buildPublisherHref(null)).toBeNull();
    expect(buildPublisherLabel(null)).toBeNull();
  });

  it("returns null for undefined slug", () => {
    expect(buildPublisherHref(undefined)).toBeNull();
    expect(buildPublisherLabel(undefined)).toBeNull();
  });

  it("returns null for empty string slug", () => {
    expect(buildPublisherHref("")).toBeNull();
    expect(buildPublisherLabel("")).toBeNull();
  });
});
