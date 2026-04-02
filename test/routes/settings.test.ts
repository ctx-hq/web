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

function postForm(path: string, data: Record<string, string>) {
  const body = new URLSearchParams(data);
  return reqWithSession(path, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  // Default: authenticated user
  mockFetch.mockImplementation((url: string) => {
    if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
    if (url.includes("/v1/profiles/")) return Promise.resolve(apiJson({ slug: "testuser", kind: "user", bio: "Hi", website: "https://example.com", packages: 0, created_at: "2025-01-01" }));
    if (url.includes("/v1/me/tokens") && !url.includes("create")) return Promise.resolve(apiJson({ tokens: [] }));
    return Promise.resolve(apiJson({}));
  });
});

// --- GET /settings ---

describe("GET /settings", () => {
  it("redirects to /login when unauthenticated", async () => {
    const res = await app.request("/settings", {}, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("preserves tab in login redirect", async () => {
    const res = await app.request("/settings?tab=tokens", {}, ENV);
    expect(res.status).toBe(302);
    const location = res.headers.get("Location") || "";
    expect(location).toContain("/login");
    expect(location).toContain("tab%3Dtokens");
  });

  it("preserves account tab in login redirect", async () => {
    const res = await app.request("/settings?tab=account", {}, ENV);
    expect(res.status).toBe(302);
    const location = res.headers.get("Location") || "";
    expect(location).toContain("tab%3Daccount");
  });

  it("renders settings page when authenticated", async () => {
    const res = await reqWithSession("/settings");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Settings");
  });

  it("defaults to profile tab", async () => {
    const res = await reqWithSession("/settings");
    const html = await res.text();
    // Profile tab should have aria-current="page"
    expect(html).toContain("Profile");
    expect(html).toContain("bio");
  });

  it("renders tokens tab", async () => {
    const res = await reqWithSession("/settings?tab=tokens");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Create New Token");
  });

  it("renders account tab", async () => {
    const res = await reqWithSession("/settings?tab=account");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Rename Account");
    expect(html).toContain("Danger Zone");
  });

  it("falls back to profile for invalid tab", async () => {
    const res = await reqWithSession("/settings?tab=invalid");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("bio");
  });
});

// --- GET /settings/tokens (redirect) ---

describe("GET /settings/tokens (old path)", () => {
  it("redirects to /settings?tab=tokens", async () => {
    const res = await reqWithSession("/settings/tokens");
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/settings?tab=tokens");
  });

  it("preserves error query param on redirect", async () => {
    const res = await reqWithSession("/settings/tokens?error=Something+went+wrong");
    expect(res.status).toBe(302);
    const location = res.headers.get("Location") || "";
    expect(location).toContain("tab=tokens");
    expect(location).toContain("error=");
  });
});

// --- POST /settings/profile/update ---

describe("POST /settings/profile/update", () => {
  it("redirects to /login when unauthenticated", async () => {
    const res = await app.request("/settings/profile/update", {
      method: "POST",
      body: new URLSearchParams({ bio: "test" }),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/login");
  });

  it("redirects to profile tab with success on success", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me/profile") && opts?.method === "PATCH") return Promise.resolve(apiJson({ ok: true }));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/profile/update", { bio: "Hello world", website: "https://example.com" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("tab=profile");
    expect(res.headers.get("Location")).toContain("success=");
  });

  it("redirects with error on API failure", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me/profile") && opts?.method === "PATCH") return Promise.resolve(apiJson({ message: "Bio too long" }, 400));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/profile/update", { bio: "x".repeat(300) });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
  });
});

// --- POST /settings/account/rename ---

describe("POST /settings/account/rename", () => {
  it("redirects with error when fields are missing", async () => {
    const res = await postForm("/settings/account/rename", { new_username: "", confirm: "" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
  });

  it("redirects with success on successful rename", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me/rename") && opts?.method === "PATCH") return Promise.resolve(apiJson({ old_username: "testuser", new_username: "newname", packages_updated: 2 }));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/account/rename", { new_username: "newname", confirm: "testuser" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("success=");
  });

  it("redirects with error on cooldown", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me/rename") && opts?.method === "PATCH") return Promise.resolve(apiJson({ message: "Please wait 30 days" }, 400));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/account/rename", { new_username: "newname", confirm: "testuser" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
  });
});

// --- POST /settings/account/delete ---

describe("POST /settings/account/delete", () => {
  it("rejects when confirm does not match username", async () => {
    const res = await postForm("/settings/account/delete", { confirm: "wrong-name" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
    expect(res.headers.get("Location")).toContain("tab=account");
  });

  it("rejects when confirm is empty", async () => {
    const res = await postForm("/settings/account/delete", { confirm: "" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
  });

  it("redirects to / and clears session on success", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me") && opts?.method === "DELETE") return Promise.resolve(apiJson({ deleted: true }));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/account/delete", { confirm: "testuser" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
    // Cookie should be cleared (set-cookie with expiry)
    const setCookie = res.headers.get("Set-Cookie") || "";
    expect(setCookie).toContain("__Host-ctx_session");
  });

  it("redirects with error on API failure", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me") && opts?.method === "DELETE") return Promise.resolve(apiJson({ message: "Cannot delete: sole owner of org" }, 400));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/account/delete", { confirm: "testuser" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
    expect(res.headers.get("Location")).toContain("tab=account");
  });
});

// --- POST /settings/tokens/create (updated redirect) ---

describe("POST /settings/tokens/create", () => {
  it("redirects to /settings?tab=tokens on success", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me/tokens") && opts?.method === "POST") return Promise.resolve(apiJson({ id: "tok-1", token: "ctx_abc", name: "ci" }));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/tokens/create", { name: "ci-key" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/settings?tab=tokens");
  });

  it("redirects with error when name is empty", async () => {
    const res = await postForm("/settings/tokens/create", { name: "" });
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=");
  });
});

// --- POST /settings/tokens/:id/revoke (updated redirect) ---

describe("POST /settings/tokens/:id/revoke", () => {
  it("redirects to /settings?tab=tokens on success", async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("/v1/me/tokens/") && opts?.method === "DELETE") return Promise.resolve(new Response(null, { status: 204 }));
      if (url.includes("/v1/me")) return Promise.resolve(apiJson(ME));
      return Promise.resolve(apiJson({}));
    });
    const res = await postForm("/settings/tokens/tok-1/revoke", {});
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/settings?tab=tokens");
    expect(res.headers.get("Location")).toContain("success=");
  });
});
