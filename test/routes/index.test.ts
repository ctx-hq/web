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
});
