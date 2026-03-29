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
  // Default: API returns empty results (for home/search routes that may be hit)
  mockFetch.mockResolvedValue(apiJson({ packages: [], total: 0 }));
});

// Helper: create a request with a session cookie
function reqWithSession(path: string, opts: RequestInit = {}) {
  const headers = new Headers(opts.headers);
  headers.set("Cookie", "__Host-ctx_session=valid-token");
  return app.request(path, { ...opts, headers }, ENV);
}

describe("GET /login/device — unauthenticated", () => {
  it("redirects to /login with redirect param", async () => {
    const res = await app.request("/login/device", {}, ENV);
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    expect(location).toContain("/login?redirect=");
    expect(location).toContain(encodeURIComponent("/login/device"));
  });

  it("preserves code in redirect URL", async () => {
    const res = await app.request("/login/device?code=ABC123XY", {}, ENV);
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    expect(location).toContain(encodeURIComponent("/login/device?code=ABC123XY"));
  });
});

describe("GET /login/device — authenticated", () => {
  beforeEach(() => {
    // Mock /v1/me to return a valid user
    mockFetch.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/v1/me")) {
        return Promise.resolve(apiJson({ username: "testuser", avatar_url: "https://example.com/avatar.png" }));
      }
      return Promise.resolve(apiJson({ packages: [], total: 0 }));
    });
  });

  it("renders device login page", async () => {
    const res = await reqWithSession("/login/device");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Authorize Device");
    expect(html).toContain("data-device-form");
    expect(html).toContain("user_code");
  });

  it("pre-fills code from query parameter", async () => {
    const res = await reqWithSession("/login/device?code=TESTCODE");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('value="TESTCODE"');
  });

  it("renders empty input when no code provided", async () => {
    const res = await reqWithSession("/login/device");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('value=""');
  });

  it("contains informational text about granting access", async () => {
    const res = await reqWithSession("/login/device");
    const html = await res.text();
    expect(html).toContain("ctx");
    expect(html).toContain("access to your getctx.org account");
  });
});

describe("POST /api/device/authorize — proxy", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/device/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: "TESTCODE" }),
    }, ENV);

    expect(res.status).toBe(401);
  });

  it("forwards user_code to API with bearer token", async () => {
    mockFetch.mockResolvedValueOnce(apiJson({ authorized: true }));

    const res = await reqWithSession("/api/device/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: "TESTCODE" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { authorized: boolean };
    expect(body.authorized).toBe(true);

    // Verify the API was called with correct params
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test/v1/auth/device/authorize",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer valid-token",
        }),
      }),
    );
  });

  it("forwards API error responses", async () => {
    mockFetch.mockResolvedValueOnce(apiJson(
      { error: "bad_request", message: "Invalid or expired code" },
      400,
    ));

    const res = await reqWithSession("/api/device/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: "BADCODE1" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { message: string };
    expect(body.message).toContain("Invalid or expired");
  });

  it("returns structured JSON on invalid request body", async () => {
    const res = await reqWithSession("/api/device/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string; message: string };
    expect(body.error).toBe("bad_request");
    expect(body.message).toBeTruthy();
  });

  it("returns structured JSON when upstream API is unreachable", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network error"));

    const res = await reqWithSession("/api/device/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_code: "TESTCODE" }),
    });

    expect(res.status).toBe(502);
    const body = await res.json() as { error: string; message: string };
    expect(body.error).toBe("server_error");
    expect(body.message).toBeTruthy();
  });
});
