import { describe, it, expect } from "vitest";
import { searchUrl, resultCountText, validateSort } from "../../src/lib/search-url";

describe("searchUrl", () => {
  it("no params returns bare /search", () => {
    expect(searchUrl("", undefined, 1)).toBe("/search");
  });

  it("query only", () => {
    expect(searchUrl("test", undefined, 1)).toBe("/search?q=test");
  });

  it("type only", () => {
    expect(searchUrl("", "skill", 1)).toBe("/search?type=skill");
  });

  it("query + type", () => {
    expect(searchUrl("test", "mcp", 1)).toBe("/search?q=test&type=mcp");
  });

  it("page > 1 included", () => {
    expect(searchUrl("test", undefined, 2)).toBe("/search?q=test&page=2");
  });

  it("page 1 omitted", () => {
    expect(searchUrl("test", undefined, 1)).toBe("/search?q=test");
  });

  it("omits default sort (downloads)", () => {
    expect(searchUrl("", undefined, 1, "downloads")).toBe("/search");
  });

  it("includes non-default sort", () => {
    expect(searchUrl("", undefined, 1, "newest")).toBe("/search?sort=newest");
  });

  it("preserves sort with type and page", () => {
    expect(searchUrl("", "skill", 2, "newest")).toBe("/search?type=skill&sort=newest&page=2");
  });

  it("preserves sort with query", () => {
    expect(searchUrl("test", undefined, 1, "newest")).toBe("/search?q=test&sort=newest");
  });

  it("all params combined", () => {
    expect(searchUrl("test", "mcp", 3, "newest")).toBe("/search?q=test&type=mcp&sort=newest&page=3");
  });

  it("type-only browsing with pagination", () => {
    expect(searchUrl("", "skill", 2)).toBe("/search?type=skill&page=2");
  });
});

describe("resultCountText", () => {
  it("no filters — plural", () => {
    expect(resultCountText(42, "")).toBe("42 packages");
  });

  it("no filters — singular", () => {
    expect(resultCountText(1, "")).toBe("1 package");
  });

  it("no filters — zero", () => {
    expect(resultCountText(0, "")).toBe("0 packages");
  });

  it("query only — plural", () => {
    expect(resultCountText(3, "test")).toBe("3 results for \u201ctest\u201d");
  });

  it("query only — singular", () => {
    expect(resultCountText(1, "test")).toBe("1 result for \u201ctest\u201d");
  });

  it("query only — zero", () => {
    expect(resultCountText(0, "xyz")).toBe("0 results for \u201cxyz\u201d");
  });

  it("type only", () => {
    expect(resultCountText(10, "", "mcp")).toBe("10 mcp packages");
  });

  it("type only — singular", () => {
    expect(resultCountText(1, "", "skill")).toBe("1 skill package");
  });

  it("query + type", () => {
    expect(resultCountText(5, "review", "skill")).toBe("5 skill results for \u201creview\u201d");
  });

  it("query + type — singular", () => {
    expect(resultCountText(1, "lint", "cli")).toBe("1 cli result for \u201clint\u201d");
  });
});

describe("validateSort", () => {
  it("accepts 'downloads'", () => {
    expect(validateSort("downloads")).toBe("downloads");
  });

  it("accepts 'newest'", () => {
    expect(validateSort("newest")).toBe("newest");
  });

  it("defaults undefined to downloads", () => {
    expect(validateSort(undefined)).toBe("downloads");
  });

  it("defaults empty string to downloads", () => {
    expect(validateSort("")).toBe("downloads");
  });

  it("defaults invalid value to downloads", () => {
    expect(validateSort("invalid")).toBe("downloads");
  });

  it("rejects SQL injection attempt", () => {
    expect(validateSort("downloads; DROP TABLE")).toBe("downloads");
  });

  it("rejects XSS attempt", () => {
    expect(validateSort("<script>alert(1)</script>")).toBe("downloads");
  });

  it("rejects similar but incorrect values", () => {
    expect(validateSort("download")).toBe("downloads");
    expect(validateSort("new")).toBe("downloads");
    expect(validateSort("DOWNLOADS")).toBe("downloads");
  });
});
