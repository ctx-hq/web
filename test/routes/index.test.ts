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

function makePkg(overrides: Partial<{
  full_name: string; type: string; description: string; downloads: number; version: string; repository: string;
}> = {}) {
  return {
    full_name: "a/b", type: "skill", description: "d", downloads: 0, version: "1.0.0", repository: "",
    ...overrides,
  };
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

describe("auth middleware SSOT", () => {
  it("anonymous user sees Sign in button on home page", async () => {
    const res = await req("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Sign in");
  });

  it("logged-in user sees username in header on home page", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong", avatar_url: "https://example.com/avatar.png" }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("hong");
    expect(html).not.toContain(">Sign in<");
  });

  it("logged-in user sees Vary: Cookie header", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong" }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    expect(res.headers.get("Vary")).toContain("Cookie");
  });

  it("logged-in user gets private cache headers instead of public", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong" }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    const cc = res.headers.get("Cache-Control");
    expect(cc).toContain("private");
    expect(cc).toContain("no-store");
    expect(cc).not.toContain("s-maxage");
  });

  it("sets Vary: Cookie when cookie exists but /v1/me fails", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(new Response("Service Unavailable", { status: 503 }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    expect(res.headers.get("Vary")).toContain("Cookie");
    // Should fall back to public cache since user resolved as anonymous
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });

  it("clears stale session cookie on 401 from /v1/me", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(new Response("Unauthorized", { status: 401 }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/", {
      headers: { Cookie: "__Host-ctx_session=expired-token" },
    }, ENV);
    const setCookieHeader = res.headers.get("Set-Cookie") ?? "";
    expect(setCookieHeader).toContain("__Host-ctx_session");
    // Cookie deletion sets Max-Age=0
    expect(setCookieHeader).toMatch(/Max-Age=0/i);
  });

  it("auth middleware skips non-HTML routes", async () => {
    const res = await req("/api/search-suggest?q=ab");
    expect(res.status).toBe(200);
    // /v1/me should NOT be called for API proxy routes
    const meCall = mockFetch.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("/v1/me")
    );
    expect(meCall).toBeUndefined();
  });
});

describe("real app routes", () => {
  it("home route responds with 200", async () => {
    const res = await req("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("getctx");
  });

  it("home page has fused tabbed-input control", async () => {
    const res = await req("/");
    const html = await res.text();
    expect(html).toContain("cn-tabbed-input");
    expect(html).toContain("data-home-tab");
    expect(html).toContain('aria-label="Package type filter"');
  });

  it("home page tab order is All, skill, cli, mcp", async () => {
    const res = await req("/");
    const html = await res.text();
    // All tabs should appear in order: All → skill → cli → mcp
    const allIdx = html.indexOf(">All<");
    const skillIdx = html.indexOf('data-home-tab="skill"');
    const cliIdx = html.indexOf('data-home-tab="cli"');
    const mcpIdx = html.indexOf('data-home-tab="mcp"');
    expect(allIdx).toBeGreaterThan(-1);
    expect(skillIdx).toBeGreaterThan(allIdx);
    expect(cliIdx).toBeGreaterThan(skillIdx);
    expect(mcpIdx).toBeGreaterThan(cliIdx);
  });

  it("home page get-started uses cn-install-tab underline style", async () => {
    const res = await req("/");
    const html = await res.text();
    expect(html).toContain("cn-install-tab");
    expect(html).toContain("cn-install-tab-active");
  });

  it("get-started tab labels are Agent and Human", async () => {
    const res = await req("/");
    const html = await res.text();
    const installTabsSection = html.slice(
      html.indexOf('class="install-tabs'),
      html.indexOf('data-panel="agent"'),
    );
    expect(installTabsSection).toMatch(/>\s*Agent\s*</);
    expect(installTabsSection).toMatch(/>\s*Human\s*</);
  });

  it("search with q param calls API search", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [makePkg()], total: 1 })
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
      apiJson({ packages: [makePkg({ full_name: "x/y", downloads: 5 })], total: 1 })
    );

    const res = await req("/search?type=skill");
    expect(res.status).toBe(200);
    const html = await res.text();
    // Should NOT show empty state
    expect(html).not.toContain("No packages found");
    // Should call listPackages with type, not search
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/packages?type=skill"),
      expect.anything()
    );
  });

  it("home page shows unavailable state when API rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const res = await req("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Service temporarily unavailable");
    expect(html).not.toContain("No packages yet");
  });

  it("search page shows unavailable state when search API rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const res = await req("/search?q=test");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Service temporarily unavailable");
  });

  it("browse page shows unavailable state when list API rejects", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));
    const res = await req("/search");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Service temporarily unavailable");
    expect(html).not.toContain("No packages yet");
  });

  it("search meta uses type when no query", async () => {
    const res = await req("/search?type=mcp");
    const html = await res.text();
    expect(html).toContain("Browse mcp packages");
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
        packages: Array.from({ length: 30 }, (_, i) => makePkg({ full_name: `a/pkg${i}` })),
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
      apiJson({ packages: [makePkg()], total: 60 })
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
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(new Response("Unauthorized", { status: 401 }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/dashboard", {
      headers: { Cookie: "__Host-ctx_session=fake-token" },
    }, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("dashboard with valid session renders page", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong" }));
      }
      if (typeof url === "string" && url.includes("/v1/publishers/")) {
        return Promise.resolve(apiJson({ publisher: { slug: "hong", kind: "user" }, packages: [], total: 0 }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });

    const res = await app.request("/dashboard", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("hong");
  });
});

describe("browse & sort", () => {
  it("search with no params calls listPackages (browse mode)", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: Array.from({ length: 5 }, (_, i) => makePkg({ full_name: `a/pkg${i}` })), total: 5 })
    );

    const res = await req("/search");
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/packages"),
      expect.anything()
    );
    const html = await res.text();
    expect(html).toContain("5 packages");
    // Should not show old empty state
    expect(html).not.toContain("Search for packages");
  });

  it("search with sort=newest passes sort to API", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    await req("/search?sort=newest");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("sort=created_at"),
      expect.anything()
    );
  });

  it("search with sort=downloads omits sort param (API default)", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    await req("/search?sort=downloads");
    const call = mockFetch.mock.calls[0][0] as string;
    expect(call).not.toContain("sort=");
  });

  it("search with q ignores sort param (uses search API)", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    await req("/search?q=test&sort=newest");
    // Should call search API, not listPackages
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/search?q=test"),
      expect.anything()
    );
  });

  it("invalid sort defaults to downloads (omits sort param)", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    await req("/search?sort=invalid");
    const call = mockFetch.mock.calls[0][0] as string;
    expect(call).not.toContain("sort=");
  });

  it("sort with type passes both to API", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    await req("/search?type=skill&sort=newest");
    const call = mockFetch.mock.calls[0][0] as string;
    expect(call).toContain("type=skill");
    expect(call).toContain("sort=created_at");
  });

  it("page beyond total preserves sort in redirect", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 10 }));
    const res = await req("/search?sort=newest&page=999");
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    expect(location).toContain("sort=newest");
  });

  it("shows type-specific count text", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [makePkg()], total: 1 })
    );
    const res = await req("/search?type=skill");
    const html = await res.text();
    expect(html).toContain("1 skill package");
  });

  it("browse mode with 0 API results shows empty state (no mock fallback)", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    const res = await req("/search");
    const html = await res.text();
    // API returned empty — should show empty CTA, not mock data
    expect(html).toContain("No packages yet");
  });

  it("search page has filter navigation", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [makePkg()], total: 1 })
    );
    const res = await req("/search?type=skill");
    const html = await res.text();
    expect(html).toContain('aria-label="Filter by type"');
    expect(html).toContain('aria-current="page"');
  });

  it("search page has sort dropdown in browse mode", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [makePkg()], total: 1 })
    );
    const res = await req("/search");
    const html = await res.text();
    expect(html).toContain("sort-select");
    expect(html).toContain("Downloads");
    expect(html).toContain("Newest");
  });

  it("search page hides sort dropdown when query present", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [makePkg()], total: 1 })
    );
    const res = await req("/search?q=test");
    const html = await res.text();
    expect(html).not.toContain("sort-select");
  });

  it("invalid type param treated as all", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({ packages: [makePkg()], total: 1 })
    );
    const res = await req("/search?type=invalid");
    expect(res.status).toBe(200);
    // Should call listPackages without type filter
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/packages?"),
      expect.anything()
    );
  });
});

describe("search result text", () => {
  it("query with no results shows helpful message", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ packages: [], total: 0 }));
    const res = await req("/search?q=nonexistent");
    const html = await res.text();
    expect(html).toContain("No packages found");
    expect(html).toContain("browse all packages");
  });

  it("pagination preserves all params", async () => {
    mockFetch.mockResolvedValueOnce(
      apiJson({
        packages: Array.from({ length: 30 }, (_, i) => makePkg({ full_name: `a/pkg${i}` })),
        total: 60,
      })
    );
    const res = await req("/search?type=mcp&sort=newest");
    const html = await res.text();
    // Next link should preserve type and sort
    expect(html).toContain("type=mcp");
    expect(html).toContain("sort=newest");
  });
});

describe("security headers", () => {
  it("all responses include security headers", async () => {
    const res = await req("/");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(res.headers.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
  });

  it("security headers on API proxy route", async () => {
    const res = await req("/api/search-suggest?q=ab");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("security headers on docs route", async () => {
    const res = await req("/docs");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("privacy page", () => {
  it("privacy route responds with 200", async () => {
    const res = await req("/privacy");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Privacy Policy");
  });

  it("privacy page lists cookies used", async () => {
    const res = await req("/privacy");
    const html = await res.text();
    expect(html).toContain("__Host-ctx_session");
    expect(html).toContain("__Host-oauth_state");
    expect(html).toContain("__Host-oauth_redirect");
    expect(html).toContain("three cookies");
  });

  it("privacy page mentions no analytics", async () => {
    const res = await req("/privacy");
    const html = await res.text();
    expect(html).toContain("No analytics or tracking scripts");
  });
});

describe("cookie security", () => {
  it("login page sets __Host-oauth_state cookie", async () => {
    const res = await req("/login");
    const setCookieHeader = res.headers.get("Set-Cookie") ?? "";
    expect(setCookieHeader).toContain("__Host-oauth_state=");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("Secure");
  });

  it("logout clears __Host-ctx_session cookie", async () => {
    const res = await req("/logout");
    expect(res.status).toBe(302);
    const setCookieHeader = res.headers.get("Set-Cookie") ?? "";
    expect(setCookieHeader).toContain("__Host-ctx_session");
  });
});

describe("no third-party font requests", () => {
  it("layout does not reference Google Fonts", async () => {
    const res = await req("/");
    const html = await res.text();
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).not.toContain("fonts.gstatic.com");
  });
});
