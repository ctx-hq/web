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

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue(apiJson({ packages: [], total: 0 }));
});

describe("GET /login/callback — SSOT OAuth", () => {
  it("redirects to /login when code is missing", async () => {
    const res = await app.request("/login/callback?state=abc", {}, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("redirects to /login when state is missing", async () => {
    const res = await app.request("/login/callback?code=abc", {}, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("redirects to /login when state does not match cookie", async () => {
    const res = await app.request("/login/callback?code=abc&state=wrong", {
      headers: { Cookie: "__Host-oauth_state=correct" },
    }, ENV);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });

  it("forwards code to API and sets session cookie on success", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ token: "ctx_session_token" }));

    const res = await app.request("/login/callback?code=gh_code_123&state=test-state", {
      headers: { Cookie: "__Host-oauth_state=test-state" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/dashboard");

    // Verify API was called with { code } (SSOT)
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/v1/auth/github",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "gh_code_123" }),
      }),
    );

    // Verify session cookie is set
    const cookies = res.headers.get("Set-Cookie") ?? "";
    expect(cookies).toContain("__Host-ctx_session=ctx_session_token");
  });

  it("redirects to /login when API returns error", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ error: "github_oauth_failed" }, 401));

    const res = await app.request("/login/callback?code=bad_code&state=test-state", {
      headers: { Cookie: "__Host-oauth_state=test-state" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
  });
});

describe("GET /login/callback — redirect support", () => {
  it("honors redirect cookie after successful login", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ token: "ctx_token" }));

    const res = await app.request("/login/callback?code=gh_code&state=s1", {
      headers: { Cookie: "__Host-oauth_state=s1; __Host-oauth_redirect=/login/device?code=ABC" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login/device?code=ABC");
  });

  it("ignores absolute URL in redirect cookie (open redirect prevention)", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ token: "ctx_token" }));

    const res = await app.request("/login/callback?code=gh_code&state=s1", {
      headers: { Cookie: "__Host-oauth_state=s1; __Host-oauth_redirect=https://evil.com" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/dashboard");
  });

  it("ignores protocol-relative URL in redirect cookie", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ token: "ctx_token" }));

    const res = await app.request("/login/callback?code=gh_code&state=s1", {
      headers: { Cookie: "__Host-oauth_state=s1; __Host-oauth_redirect=//evil.com" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/dashboard");
  });

  it("defaults to /dashboard when no redirect cookie", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ token: "ctx_token" }));

    const res = await app.request("/login/callback?code=gh_code&state=s1", {
      headers: { Cookie: "__Host-oauth_state=s1" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/dashboard");
  });
});

describe("GET /login/callback — cookie cleanup on failure", () => {
  it("clears oauth_redirect when code is missing", async () => {
    const res = await app.request("/login/callback?state=s1", {
      headers: { Cookie: "__Host-oauth_state=s1; __Host-oauth_redirect=/login/device?code=ABC" },
    }, ENV);

    expect(res.status).toBe(302);
    const cookies = res.headers.get("Set-Cookie") ?? "";
    expect(cookies).toContain("__Host-oauth_redirect");
  });

  it("clears oauth_redirect when state does not match", async () => {
    const res = await app.request("/login/callback?code=c1&state=wrong", {
      headers: { Cookie: "__Host-oauth_state=correct; __Host-oauth_redirect=/login/device" },
    }, ENV);

    expect(res.status).toBe(302);
    const cookies = res.headers.get("Set-Cookie") ?? "";
    expect(cookies).toContain("__Host-oauth_redirect");
  });

  it("clears oauth_redirect when API returns error", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ error: "bad_code" }, 401));

    const res = await app.request("/login/callback?code=bad&state=s1", {
      headers: { Cookie: "__Host-oauth_state=s1; __Host-oauth_redirect=/login/device" },
    }, ENV);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/login");
    const cookies = res.headers.get("Set-Cookie") ?? "";
    expect(cookies).toContain("__Host-oauth_redirect");
  });
});
