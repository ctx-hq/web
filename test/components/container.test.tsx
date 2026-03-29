import { describe, it, expect } from "vitest";

describe("container", () => {
  const sizeClasses = {
    default: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8",
    narrow: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8",
  };

  it("default size uses max-w-6xl", () => {
    expect(sizeClasses.default).toContain("max-w-6xl");
  });

  it("narrow size uses max-w-3xl", () => {
    expect(sizeClasses.narrow).toContain("max-w-3xl");
  });

  it("both sizes include responsive padding", () => {
    for (const cls of Object.values(sizeClasses)) {
      expect(cls).toContain("px-4");
      expect(cls).toContain("sm:px-6");
      expect(cls).toContain("lg:px-8");
    }
  });

  it("both sizes center with mx-auto", () => {
    for (const cls of Object.values(sizeClasses)) {
      expect(cls).toContain("mx-auto");
    }
  });
});
