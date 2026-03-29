import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../../src/index";

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

const ENV = { API_BASE_URL: "https://api.test", GITHUB_CLIENT_ID: "test-id" };

function req(path: string) {
  return app.request(path, {}, ENV);
}

const fakePkg = {
  full_name: "@test/existing",
  type: "skill",
  description: "A test package for automated testing",
  license: "MIT",
  repository: "https://github.com/test/existing",
  downloads: 42,
  keywords: ["testing", "automation"],
  platforms: ["linux", "macos"],
  versions: [
    { version: "1.0.0", yanked: false, created_at: "2025-01-01" },
    { version: "0.9.0", yanked: true, created_at: "2024-12-01" },
  ],
  owner: "test",
  created_at: "2024-12-01",
  updated_at: "2025-01-01",
};

const fakeVersion = {
  ...fakePkg.versions[0],
  readme: "# Hello\n\nThis is a test package.",
  manifest: "",
  sha256: "",
  published_by: "test",
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("package detail routes", () => {
  // === Existing (preserved) ===

  it("resolves /@scope/name as package detail", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("test/existing");
  });

  it("returns 404 for missing packages not in mock data", async () => {
    mockFetch.mockResolvedValueOnce(api404());

    const res = await req("/@unknown/nonexistent");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("not found");
  });

  it("canonical URL uses unencoded scope/name", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson({ ...fakeVersion, readme: "" }));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("/@test/existing");
    expect(html).not.toContain("%2F");
  });

  it("URL-encoded /@scope%2Fname does NOT match package route (returns 404)", async () => {
    const res = await req("/@test%2Fexisting");
    expect(res.status).toBe(404);
  });

  // === Layout structure ===

  it("renders back link with href to /search", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain('href="/search"');
    expect(html).toContain("Back to search");
  });

  it("renders package name as heading", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("@test/existing");
  });

  it("renders package type badge", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("cn-badge-variant-type-skill");
  });

  it("renders description", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("A test package for automated testing");
  });

  it("renders install-tabs container", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("install-tabs");
    expect(html).toContain("ctx install @test/existing");
  });

  it("install-tabs uses cn-install-tab underline style with icons", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("cn-install-tab");
    expect(html).toContain("cn-install-tab-active");
    expect(html).toContain('data-icon="robot"');
    expect(html).toContain('data-icon="terminal"');
  });

  it("install-tabs has ARIA tablist/tab/tabpanel roles", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="panel-agent"');
    expect(html).toContain('aria-labelledby="tab-agent"');
  });

  it("install-tabs labels are Agent and Human", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    const installTabsSection = html.slice(
      html.indexOf('class="install-tabs'),
      html.indexOf('data-panel="agent"'),
    );
    expect(installTabsSection).toMatch(/>\s*Agent\s*</);
    expect(installTabsSection).toMatch(/>\s*Human\s*</);
  });

  // === README ===

  it("renders README HTML in prose container", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("class=\"prose\"");
    expect(html).toContain("Hello");
  });

  it("shows 'No README available' when readme is empty", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson({ ...fakeVersion, readme: "" }));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("No README available");
  });

  it("shows 'No README available' when version fetch fails", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(new Response("error", { status: 500 }));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("No README available");
  });

  // === Metadata ===

  it("shows version number in metadata", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("1.0.0");
  });

  it("shows license in metadata", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("MIT");
  });

  it("shows formatted download count", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("42");
  });

  it("shows repository link", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("https://github.com/test/existing");
    expect(html).toContain("GitHub");
  });

  it("hides repository when empty", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson({ ...fakePkg, repository: "" }))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).not.toContain("github-logo");
  });

  it("hides license when empty", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson({ ...fakePkg, license: "" }))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    // License should not appear as a metadata label
    expect(html).not.toContain(">License<");
  });

  // === Keywords & Platforms ===

  it("renders keywords as search links", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("/search?q=testing");
    expect(html).toContain("/search?q=automation");
  });

  it("does not render keywords section when empty", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson({ ...fakePkg, keywords: [] }))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).not.toContain(">Keywords<");
  });

  it("renders platform badges", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("linux");
    expect(html).toContain("macos");
  });

  it("does not render platforms section when empty", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson({ ...fakePkg, platforms: [] }))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).not.toContain(">Platforms<");
  });

  // === Versions ===

  it("renders version list", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).toContain("0.9.0"); // second version
    expect(html).toContain("2024-12-01");
  });

  it("does not render versions section when empty", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson({ ...fakePkg, versions: [] }))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const html = await res.text();
    expect(html).not.toContain(">Versions<");
  });

  // === Cache ===

  it("sets correct cache headers", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson(fakeVersion));

    const res = await req("/@test/existing");
    const cc = res.headers.get("Cache-Control");
    expect(cc).toContain("s-maxage=300");
  });

  it("network error returns 500", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));

    const res = await req("/@anthropic/code-review");
    expect(res.status).toBe(500);
  });

  it("404 for unknown package", async () => {
    mockFetch.mockResolvedValueOnce(api404());

    const res = await req("/@totally/unknown");
    expect(res.status).toBe(404);
  });
});

describe(".ctx endpoint", () => {
  it("proxies .ctx request and returns plain text", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("# skill content", { status: 200 }),
    );

    const res = await req("/@test/existing.ctx");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("skill content");
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("returns 404 when API says not found", async () => {
    mockFetch.mockResolvedValueOnce(api404());

    const res = await req("/@test/missing.ctx");
    expect(res.status).toBe(404);
  });

  it("returns 502 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("timeout"));

    const res = await req("/@test/existing.ctx");
    expect(res.status).toBe(502);
  });

  it("strips .ctx suffix when calling upstream API", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("ok", { status: 200 }),
    );

    await req("/@test/existing.ctx");
    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toBe("https://api.test/@test/existing.ctx");
  });

  it("anonymous: uses public cache headers", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("# content", { status: 200 }),
    );

    const res = await req("/@test/existing.ctx");
    expect(res.status).toBe(200);
    const cc = res.headers.get("Cache-Control") ?? "";
    expect(cc).toContain("public");
    expect(cc).toContain("s-maxage=300");
  });

  it("anonymous: does NOT pass Authorization header to API", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("# content", { status: 200 }),
    );

    await req("/@test/existing.ctx");
    // Find the .ctx API call (not /v1/me)
    const ctxCall = mockFetch.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes(".ctx"),
    );
    expect(ctxCall).toBeDefined();
    const headers = ctxCall![1]?.headers as Record<string, string> | undefined;
    expect(headers?.Authorization).toBeUndefined();
  });

  it("authenticated: passes Authorization header to API", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong" }));
      }
      return Promise.resolve(new Response("# content", { status: 200 }));
    });

    const res = await app.request("/@test/existing.ctx", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    expect(res.status).toBe(200);

    // Find the .ctx API call
    const ctxCall = mockFetch.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes(".ctx"),
    );
    expect(ctxCall).toBeDefined();
    const headers = ctxCall![1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer valid-token");
  });

  it("authenticated: uses private cache headers", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong" }));
      }
      return Promise.resolve(new Response("# content", { status: 200 }));
    });

    const res = await app.request("/@test/existing.ctx", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);
    const cc = res.headers.get("Cache-Control") ?? "";
    expect(cc).toContain("private");
    expect(cc).toContain("no-store");
    expect(cc).not.toContain("s-maxage");
  });

  it("auth middleware resolves user for .ctx routes (not skipped)", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "hong" }));
      }
      return Promise.resolve(new Response("# content", { status: 200 }));
    });

    await app.request("/@test/existing.ctx", {
      headers: { Cookie: "__Host-ctx_session=valid-token" },
    }, ENV);

    // /v1/me SHOULD be called (auth middleware runs for .ctx)
    const meCall = mockFetch.mock.calls.find(
      (call) => typeof call[0] === "string" && call[0].includes("/v1/me"),
    );
    expect(meCall).toBeDefined();
  });
});

describe("/skill.md endpoint", () => {
  it("proxies skill.md from GitHub", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("# ctx skill", { status: 200 }),
    );

    const res = await req("/skill.md");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("# ctx skill");
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("returns 502 when GitHub is unavailable", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Not Found", { status: 404 }),
    );

    const res = await req("/skill.md");
    expect(res.status).toBe(502);
  });

  it("returns 502 on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));

    const res = await req("/skill.md");
    expect(res.status).toBe(502);
  });
});
