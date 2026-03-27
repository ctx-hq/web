import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient, ApiError } from "../../src/lib/api-client";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ApiClient", () => {
  const client = new ApiClient("https://api.example.com");

  describe("search", () => {
    it("constructs correct URL with query params", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.search("test", { type: "mcp", limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/search?q=test&type=mcp&limit=10"),
        expect.any(Object),
      );
    });

    it("returns parsed search results", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          packages: [{ full_name: "test/pkg", type: "skill", description: "A test", version: "1.0.0", downloads: 42, repository: "" }],
          total: 1,
        }),
      );
      const result = await client.search("test");
      expect(result.total).toBe(1);
      expect(result.packages[0].full_name).toBe("test/pkg");
    });

    it("omits undefined optional params", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.search("query");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain("type=");
      expect(url).not.toContain("platform=");
    });
  });

  describe("getPackage", () => {
    it("encodes package name in URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ full_name: "scope/name" }));
      await client.getPackage("scope/name");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/packages/scope%2Fname");
    });
  });

  describe("error handling", () => {
    it("throws ApiError on non-200 response", async () => {
      mockFetch.mockResolvedValue(new Response("Not Found", { status: 404 }));

      await expect(client.getPackage("missing/pkg")).rejects.toThrow(ApiError);
    });

    it("ApiError contains status code", async () => {
      mockFetch.mockResolvedValue(new Response("Server Error", { status: 500 }));

      try {
        await client.getPackage("bad/pkg");
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(500);
      }
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValue(new Error("network failure"));

      await expect(client.search("test")).rejects.toThrow("network failure");
    });
  });

  describe("listPackages", () => {
    it("passes sort and limit params", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.listPackages({ sort: "downloads", limit: 12 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("sort=downloads");
      expect(url).toContain("limit=12");
    });
  });
});
