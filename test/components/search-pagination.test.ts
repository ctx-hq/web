import { describe, it, expect } from "vitest";

// Mirror the searchUrl logic from search.tsx
function searchUrl(query: string, type: string | undefined, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (type) params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

describe("search pagination", () => {
  it("page 1 omits page param from URL", () => {
    expect(searchUrl("test", undefined, 1)).toBe("/search?q=test");
  });

  it("page 2 includes page param", () => {
    expect(searchUrl("test", undefined, 2)).toBe("/search?q=test&page=2");
  });

  it("preserves query and type", () => {
    const url = searchUrl("hello", "mcp", 3);
    expect(url).toBe("/search?q=hello&type=mcp&page=3");
  });

  it("type-only browsing with pagination", () => {
    expect(searchUrl("", "skill", 2)).toBe("/search?type=skill&page=2");
  });

  it("no query no type page 1 returns bare /search", () => {
    expect(searchUrl("", undefined, 1)).toBe("/search");
  });

  describe("pagination math", () => {
    const PAGE_SIZE = 30;

    function computePagination(total: number, page: number) {
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const safePage = Math.max(1, Math.min(page, totalPages));
      const offset = (safePage - 1) * PAGE_SIZE;
      return { totalPages, page: safePage, offset };
    }

    it("0 results = 1 page", () => {
      expect(computePagination(0, 1)).toEqual({ totalPages: 1, page: 1, offset: 0 });
    });

    it("30 results = 1 page", () => {
      expect(computePagination(30, 1)).toEqual({ totalPages: 1, page: 1, offset: 0 });
    });

    it("31 results = 2 pages", () => {
      expect(computePagination(31, 1)).toEqual({ totalPages: 2, page: 1, offset: 0 });
    });

    it("60 results page 2 = offset 30", () => {
      expect(computePagination(60, 2)).toEqual({ totalPages: 2, page: 2, offset: 30 });
    });

    it("page beyond total clamps to last page", () => {
      expect(computePagination(10, 5)).toEqual({ totalPages: 1, page: 1, offset: 0 });
    });
  });
});
