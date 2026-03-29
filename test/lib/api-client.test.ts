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

  describe("getPackageStats", () => {
    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({
        downloads: { total: 100, weekly: 20, daily: [] },
        agents: { total_installs: 50, breakdown: [] },
      }));
      await client.getPackageStats("scope/name");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/packages/scope%2Fname/stats");
    });

    it("returns parsed stats", async () => {
      const statsData = {
        downloads: { total: 500, weekly: 80, daily: [{ date: "2025-03-20", count: 12 }] },
        agents: { total_installs: 200, breakdown: [{ agent: "claude", count: 100, percentage: 50 }] },
      };
      mockFetch.mockResolvedValue(jsonResponse(statsData));
      const result = await client.getPackageStats("test/pkg");
      expect(result.downloads.total).toBe(500);
      expect(result.agents.breakdown[0].agent).toBe("claude");
    });
  });

  describe("getPublisher", () => {
    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ slug: "hong", kind: "user", packages: 5, created_at: "2025-01-01T00:00:00Z" }));
      await client.getPublisher("hong");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/publishers/hong");
    });

    it("encodes special characters in slug", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ slug: "my org", kind: "org", packages: 0, created_at: "" }));
      await client.getPublisher("my org");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/publishers/my%20org");
    });
  });

  describe("getTrending", () => {
    it("uses default limit", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], period: "7d" }));
      await client.getTrending();

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/stats/trending?limit=20");
    });

    it("accepts custom limit", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], period: "7d" }));
      await client.getTrending(10);

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("limit=10");
    });
  });

  describe("getAgentRankings", () => {
    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ agents: [] }));
      await client.getAgentRankings();

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/stats/agents");
    });

    it("returns parsed rankings", async () => {
      mockFetch.mockResolvedValue(jsonResponse({
        agents: [{ name: "claude", total_installs: 5000, packages: 120 }],
      }));
      const result = await client.getAgentRankings();
      expect(result.agents).toHaveLength(1);
      expect(result.agents[0].name).toBe("claude");
    });
  });

  describe("getAgentDetail", () => {
    it("encodes agent name in URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ agent: "claude", total_installs: 100, top_packages: [] }));
      await client.getAgentDetail("claude");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/stats/agents/claude");
    });
  });

  describe("getOrg", () => {
    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ id: "1", name: "acme", members: 5, packages: 10 }));
      await client.getOrg("acme");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/orgs/acme");
    });
  });

  describe("getOrgPackages", () => {
    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [] }));
      await client.getOrgPackages("acme");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/orgs/acme/packages");
    });
  });

  describe("getSyncProfile", () => {
    it("sends Authorization header", async () => {
      mockFetch.mockResolvedValue(jsonResponse({
        profile: { packages: [] },
        meta: { package_count: 0, syncable_count: 0, unsyncable_count: 0, last_push_at: null, last_pull_at: null, last_push_device: "", last_pull_device: "" },
      }));
      await client.getSyncProfile("test-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    });

    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({
        profile: { packages: [] },
        meta: { package_count: 0, syncable_count: 0, unsyncable_count: 0, last_push_at: null, last_pull_at: null, last_push_device: "", last_pull_device: "" },
      }));
      await client.getSyncProfile("token");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/me/sync-profile");
    });
  });

  describe("getPublisherPackages", () => {
    it("constructs correct URL with params", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ publisher: { slug: "hong", kind: "user" }, packages: [] }));
      await client.getPublisherPackages("hong", { type: "skill", limit: 5 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/publishers/hong/packages");
      expect(url).toContain("type=skill");
      expect(url).toContain("limit=5");
    });
  });

  describe("getPackageTags", () => {
    it("constructs correct URL", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ tags: { latest: "1.0.0" } }));
      await client.getPackageTags("scope/name");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/v1/packages/scope%2Fname/tags");
    });
  });

  describe("getMyOrgs", () => {
    it("sends Authorization header", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ orgs: [] }));
      await client.getMyOrgs("my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });
  });

  describe("token passthrough", () => {
    it("search passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.search("test", {}, "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("search omits Authorization header when no token", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.search("test");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it("listPackages passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.listPackages({}, "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("getPackage passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ full_name: "scope/name" }));
      await client.getPackage("scope/name", "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("getPackageStats passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ downloads: {}, agents: {} }));
      await client.getPackageStats("scope/name", "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("getPublisherPackages passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ publisher: {}, packages: [] }));
      await client.getPublisherPackages("hong", {}, "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("getOrgPackages passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [] }));
      await client.getOrgPackages("acme", "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("getTrending passes Authorization header when token provided", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], period: "7d" }));
      await client.getTrending(20, "my-token");

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBe("Bearer my-token");
    });

    it("null token is treated as no token", async () => {
      mockFetch.mockResolvedValue(jsonResponse({ packages: [], total: 0 }));
      await client.listPackages({}, null);

      const opts = mockFetch.mock.calls[0][1] as RequestInit;
      expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
    });
  });
});
