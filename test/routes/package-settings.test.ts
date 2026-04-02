import { describe, it, expect, vi, beforeEach } from "vitest";
import app from "../../src/index";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const ENV = { API_BASE_URL: "https://api.test", GITHUB_CLIENT_ID: "test-id" };

function apiJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function apiError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), { status });
}

const sessionCookie = "__Host-ctx_session=valid-token";

function mockAuthAndPackage(pkg?: Record<string, unknown>) {
  const defaultPkg = {
    full_name: "@test/my-pkg",
    type: "skill",
    description: "Test",
    keywords: ["old"],
    homepage: "",
    repository: "",
    license: "MIT",
    author: "tester",
    visibility: "public",
    versions: [{ version: "1.0.0", yanked: false, created_at: "2026-01-01" }],
    dist_tags: { latest: "1.0.0" },
    owner: { slug: "test", kind: "user" },
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  mockFetch.mockImplementation((url: string, init?: RequestInit) => {
    // Auth: /v1/me
    if (typeof url === "string" && url.includes("/v1/me")) {
      return Promise.resolve(apiJson({ username: "test" }));
    }
    // Trusted publishers
    if (typeof url === "string" && url.includes("/trusted-publishers")) {
      return Promise.resolve(apiJson({ trusted_publishers: [] }));
    }
    // Tags
    if (typeof url === "string" && url.includes("/tags")) {
      return Promise.resolve(apiJson({ tags: { latest: "1.0.0" } }));
    }
    // Access
    if (typeof url === "string" && url.includes("/access") && !init?.method) {
      return Promise.resolve(apiJson({ access: [] }));
    }
    // Package detail (must come after more specific /v1/packages/ sub-routes)
    if (typeof url === "string" && url.includes("/v1/packages/") && !init?.method) {
      return Promise.resolve(apiJson(pkg ?? defaultPkg));
    }
    // Metadata PATCH
    if (typeof url === "string" && url.includes("/metadata") && init?.method === "PATCH") {
      return Promise.resolve(apiJson({ full_name: "@test/my-pkg" }));
    }
    // Yank/unyank
    if (typeof url === "string" && url.includes("/yank") && init?.method === "POST") {
      return Promise.resolve(apiJson({ yanked: true }));
    }
    if (typeof url === "string" && url.includes("/unyank") && init?.method === "POST") {
      return Promise.resolve(apiJson({ yanked: false }));
    }
    // Delete version
    if (typeof url === "string" && url.includes("/versions/") && init?.method === "DELETE") {
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    // Transfer
    if (typeof url === "string" && url.includes("/transfer") && init?.method === "POST") {
      return Promise.resolve(apiJson({ id: "xfer-1" }));
    }
    // Rename
    if (typeof url === "string" && url.includes("/rename") && init?.method === "PATCH") {
      return Promise.resolve(apiJson({ new_name: "@test/renamed" }));
    }
    return Promise.resolve(new Response("ok", { status: 200 }));
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("package settings routes", () => {
  describe("GET /package/@scope/name/settings", () => {
    it("redirects to login without session", async () => {
      const res = await app.request("/package/@test/my-pkg/settings", {}, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("/login");
    });

    it("renders settings page with session", async () => {
      mockAuthAndPackage();
      const res = await app.request("/package/@test/my-pkg/settings", {
        headers: { Cookie: sessionCookie },
      }, ENV);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("Package settings");
      expect(html).toContain("Package Metadata");
      expect(html).toContain("Visibility");
      expect(html).toContain("Versions");
      expect(html).toContain("Danger Zone");
    });

    it("renders metadata fields with current values", async () => {
      mockAuthAndPackage({
        full_name: "@test/my-pkg",
        type: "skill",
        description: "My cool tool",
        keywords: ["ai", "helper"],
        homepage: "https://example.com",
        repository: "https://github.com/test/my-pkg",
        license: "Apache-2.0",
        author: "Cool Author",
        visibility: "public",
        versions: [],
        owner: { slug: "test", kind: "user" },
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      });
      const res = await app.request("/package/@test/my-pkg/settings", {
        headers: { Cookie: sessionCookie },
      }, ENV);
      const html = await res.text();
      expect(html).toContain("My cool tool");
      expect(html).toContain("ai, helper");
      expect(html).toContain("https://example.com");
      expect(html).toContain("Apache-2.0");
      expect(html).toContain("Cool Author");
    });
  });

  describe("POST /package/@scope/name/settings/metadata", () => {
    it("calls API and redirects on success", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({
        description: "Updated description",
        keywords: "ai, tool, new",
        homepage: "https://new.example.com",
        repository: "",
        license: "MIT",
        author: "Author",
      });
      const res = await app.request("/package/@test/my-pkg/settings/metadata", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("success=");

      // Verify API was called with parsed keywords
      const patchCall = mockFetch.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("/metadata"),
      );
      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall![1]?.body as string);
      expect(body.keywords).toEqual(["ai", "tool", "new"]);
    });
  });

  describe("POST /package/@scope/name/settings/versions/:version/yank", () => {
    it("calls yank API and redirects", async () => {
      mockAuthAndPackage();
      const res = await app.request("/package/@test/my-pkg/settings/versions/1.0.0/yank", {
        method: "POST",
        headers: { Cookie: sessionCookie },
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("success=");
      expect(res.headers.get("Location")).toContain("yanked");
    });
  });

  describe("POST /package/@scope/name/settings/versions/:version/unyank", () => {
    it("calls unyank API and redirects", async () => {
      mockAuthAndPackage();
      const res = await app.request("/package/@test/my-pkg/settings/versions/1.0.0/unyank", {
        method: "POST",
        headers: { Cookie: sessionCookie },
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("success=");
      expect(res.headers.get("Location")).toContain("restored");
    });
  });

  describe("POST /package/@scope/name/settings/versions/:version/delete", () => {
    it("rejects mismatched confirm text", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({ confirm: "wrong" });
      const res = await app.request("/package/@test/my-pkg/settings/versions/1.0.0/delete", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("error=");
    });

    it("deletes version with correct confirm text", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({ confirm: "@test/my-pkg@1.0.0" });
      const res = await app.request("/package/@test/my-pkg/settings/versions/1.0.0/delete", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("success=");
    });
  });

  describe("POST /package/@scope/name/settings/transfer", () => {
    it("redirects with success on valid transfer", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({
        to: "@newowner",
        message: "",
        confirm: "@test/my-pkg",
      });
      const res = await app.request("/package/@test/my-pkg/settings/transfer", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      // Bug fix: should use success, not error
      expect(res.headers.get("Location")).toContain("success=Transfer");
    });

    it("rejects mismatched confirm", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({ to: "@newowner", confirm: "wrong" });
      const res = await app.request("/package/@test/my-pkg/settings/transfer", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("error=");
    });
  });

  describe("POST /package/@scope/name/settings/rename", () => {
    it("rejects mismatched confirm", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({ new_name: "renamed", confirm: "wrong" });
      const res = await app.request("/package/@test/my-pkg/settings/rename", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("error=");
      expect(res.headers.get("Location")).toContain("Confirmation");
    });

    it("renames with correct confirm and redirects to new name", async () => {
      mockAuthAndPackage();
      const formBody = new URLSearchParams({ new_name: "renamed", confirm: "@test/my-pkg" });
      const res = await app.request("/package/@test/my-pkg/settings/rename", {
        method: "POST",
        headers: {
          Cookie: sessionCookie,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody.toString(),
      }, ENV);
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toContain("renamed");
      expect(res.headers.get("Location")).toContain("success=");
    });
  });
});
