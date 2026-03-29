import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../../src/index";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function apiJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const ENV = { API_BASE_URL: "https://api.test", GITHUB_CLIENT_ID: "test-id" };

const ME = { username: "testuser", avatar_url: "https://example.com/avatar.png" };

function reqWithSession(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers);
  headers.set("Cookie", "__Host-ctx_session=valid-token");
  return app.request(path, { ...opts, headers }, ENV);
}

function postForm(data: Record<string, string>) {
  const body = new URLSearchParams(data);
  return reqWithSession("/orgs/new", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// --- GET /orgs/new ---

describe("GET /orgs/new", () => {
  it("redirects to /login when unauthenticated", async () => {
    const res = await app.request("/orgs/new", {}, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("renders the create-org form when authenticated", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await reqWithSession("/orgs/new");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('data-create-org-form');
    expect(html).toContain('name="name"');
  });
});

// --- POST /orgs/new ---

describe("POST /orgs/new — validation", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
  });

  it("returns 422 with error for empty name", async () => {
    const res = await postForm({ name: "" });
    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("Organization name is required");
  });

  it("returns 422 with error for too-short name", async () => {
    const res = await postForm({ name: "a" });
    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("between");
  });

  it("returns 422 with error for invalid characters", async () => {
    const res = await postForm({ name: "-bad-name-" });
    expect(res.status).toBe(422);
    const html = await res.text();
    expect(html).toContain("lowercase letters");
  });
});

describe("POST /orgs/new — API errors", () => {
  beforeEach(() => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
  });

  it("redirects to /login on 401", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      if (url.includes("/v1/orgs"))
        return Promise.resolve(apiJson({ message: "Unauthorized" }, 401));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm({ name: "valid-org" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("returns 409 on name conflict", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      if (url.includes("/v1/orgs"))
        return Promise.resolve(apiJson({ message: "Organization name already taken" }, 409));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm({ name: "taken-name" });
    expect(res.status).toBe(409);
    const html = await res.text();
    expect(html).toContain("already taken");
  });

  it("returns 500 on server error", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      if (url.includes("/v1/orgs"))
        return Promise.resolve(apiJson({ message: "Internal server error" }, 500));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm({ name: "valid-org" });
    expect(res.status).toBe(500);
  });
});

describe("POST /orgs/new — success", () => {
  it("redirects to /org/:name on success", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      if (url.includes("/v1/orgs"))
        return Promise.resolve(apiJson({ id: "org-1", name: "my-team" }));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm({ name: "my-team", display_name: "My Team" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/org/my-team");
  });
});
