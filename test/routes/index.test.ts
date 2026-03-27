import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../../src/index";

// Mock fetch globally to simulate API responses
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function apiJson(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function api404() {
  return new Response("Not Found", { status: 404 });
}

beforeEach(() => {
  mockFetch.mockReset();
  // Default: API returns empty results
  mockFetch.mockResolvedValue(apiJson({ packages: [], total: 0 }));
});

const ENV = { API_BASE_URL: "https://api.test", GITHUB_CLIENT_ID: "test-id" };

function req(path: string) {
  return app.request(path, {}, ENV);
}

describe("real app routes", () => {
  it("home route responds with 200", async () => {
    const res = await req("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("getctx");
  });

  it("search with q param calls API search", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [{ full_name: "a/b", type: "skill", description: "test", downloads: 0 }], total: 1 })
    );

    const res = await req("/search?q=test");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("1 result");

    // Verify fetch was called with search endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/search?q=test"),
      expect.anything()
    );
  });

  it("search with type-only calls listPackages and shows results", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [{ full_name: "x/y", type: "skill", description: "d", downloads: 5 }], total: 1 })
    );

    const res = await req("/search?type=skill");
    expect(res.status).toBe(200);
    const html = await res.text();
    // Should NOT show empty state
    expect(html).not.toContain('No packages found');
    // Should call listPackages with type, not search
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/packages?type=skill"),
      expect.anything()
    );
  });

  it("search meta uses type when no query", async () => {
    const res = await req("/search?type=mcp");
    const html = await res.text();
    expect(html).toContain("type:mcp");
  });

  it("sitemap returns XML", async () => {
    const res = await req("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("xml");
    const body = await res.text();
    expect(body).toContain("getctx.org");
  });

  it("robots.txt returns plain text", async () => {
    const res = await req("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("unknown routes return 404", async () => {
    const res = await req("/nonexistent-path");
    expect(res.status).toBe(404);
  });

  it("search-suggest proxy returns JSON", async () => {
    const res = await req("/api/search-suggest?q=a");
    const data = await res.json();
    expect(data.packages).toHaveLength(0);
  });

  it("docs route responds", async () => {
    const res = await req("/docs");
    expect(res.status).toBe(200);
  });

  it("search with page param passes offset to API", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [], total: 60 })
    );

    const res = await req("/search?q=test&page=2");
    expect(res.status).toBe(200);

    // offset should be (2-1)*30 = 30
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("offset=30"),
      expect.anything()
    );
  });

  it("search shows pagination when total exceeds page size", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({
        packages: Array.from({ length: 30 }, (_, i) => ({
          full_name: `a/pkg${i}`, type: "skill", description: "d", downloads: 0, version: "1.0.0", repository: "",
        })),
        total: 60,
      })
    );

    const res = await req("/search?q=test");
    const html = await res.text();
    expect(html).toContain("page 1 of 2");
    expect(html).toContain("Next");
  });

  it("search page=1 has disabled Prev", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [{ full_name: "a/b", type: "skill", description: "d", downloads: 0, version: "1.0.0", repository: "" }], total: 60 })
    );

    const res = await req("/search?q=test&page=1");
    const html = await res.text();
    // Prev button should be disabled (no href)
    expect(html).toContain("disabled");
  });

  it("search with invalid page defaults to 1", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [], total: 0 })
    );

    const res = await req("/search?q=test&page=-5");
    expect(res.status).toBe(200);
    // Should not crash, offset should be 0
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("q=test"),
      expect.anything()
    );
  });

  it("search with page beyond total redirects to last page", async () => {
    // API returns total=10 (1 page of 30), but we request page=999
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [], total: 10 })
    );

    const res = await req("/search?q=test&page=999");
    // Should redirect (302) to page 1 (since totalPages=1, clamp omits page param)
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    expect(location).toContain("/search");
    expect(location).toContain("q=test");
    // Should NOT contain page= since totalPages=1
    expect(location).not.toContain("page=");
  });

  it("search with page beyond multi-page total redirects to last page", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [], total: 60 })
    );

    const res = await req("/search?q=test&page=999");
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    expect(location).toContain("page=2");
  });

  it("dashboard without cookie redirects to login", async () => {
    const res = await req("/dashboard");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("dashboard with fake session redirects to login (API rejects)", async () => {
    // The /v1/me call will use our default mock which returns 200 with {packages:[],total:0}
    // That won't have a username field, but the route should still try.
    // Let's mock a 401 response for the /v1/me call.
    mockFetch.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const res = await app.request("/dashboard", {
      headers: { Cookie: "ctx_session=fake-token" },
    }, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("dashboard with valid session renders page", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ username: "hong" })
    );

    const res = await app.request("/dashboard", {
      headers: { Cookie: "ctx_session=valid-token" },
    }, ENV);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("hong");
  });
});
