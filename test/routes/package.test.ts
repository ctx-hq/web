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
  full_name: "test/existing",
  type: "skill",
  description: "A test package",
  license: "MIT",
  repository: "https://github.com/test/existing",
  downloads: 42,
  keywords: [],
  platforms: [],
  versions: [{ version: "1.0.0", created_at: "2025-01-01" }],
  owner: "test",
  created_at: "2025-01-01",
  updated_at: "2025-01-01",
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe("package routes (real app)", () => {
  it("resolves /@scope/name as package detail", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson({ ...fakePkg.versions[0], readme: "# Hello" }));

    const res = await req("/@test/existing");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("test/existing");
  });

  it("returns 404 for missing packages", async () => {
    mockFetch.mockResolvedValueOnce(api404());

    const res = await req("/@test/nonexistent");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("not found");
  });

  it("canonical URL uses unencoded scope/name", async () => {
    mockFetch
      .mockResolvedValueOnce(apiJson(fakePkg))
      .mockResolvedValueOnce(apiJson({ ...fakePkg.versions[0], readme: "" }));

    const res = await req("/@test/existing");
    const html = await res.text();
    // canonical should be /@test/existing, NOT /@test%2Fexisting
    expect(html).toContain("/@test/existing");
    expect(html).not.toContain("%2F");
  });

  it("URL-encoded /@scope%2Fname does NOT match package route (returns 404)", async () => {
    const res = await req("/@test%2Fexisting");
    // The route pattern requires a literal / between scope and name
    expect(res.status).toBe(404);
  });
});
