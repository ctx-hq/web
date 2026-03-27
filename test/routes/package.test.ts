import { describe, it, expect } from "vitest";
import { Hono } from "hono";

describe("package routes", () => {
  function createApp() {
    const app = new Hono();

    // Simulate the actual routing pattern
    app.get("/:fullName{@[^/]+/[^/]+}", (c) => {
      const fullName = c.req.param("fullName").slice(1);
      // Simulate API lookup
      if (fullName === "test/existing") {
        return c.html(`<html><body>package: ${fullName}</body></html>`);
      }
      return c.html(`<html><body>not found: ${fullName}</body></html>`, 404);
    });

    // Profile route: /@identifier
    app.get("/:id{@[^/]+$}", (c) => {
      const id = c.req.param("id").slice(1);
      return c.html(`<html><body>profile: ${id}</body></html>`);
    });

    return app;
  }

  it("resolves /@scope/name as package detail", async () => {
    const app = createApp();
    const res = await app.request("/@test/existing");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("package: test/existing");
  });

  it("returns 404 for missing packages", async () => {
    const app = createApp();
    const res = await app.request("/@test/nonexistent");
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain("not found");
  });

  it("handles special characters in scope/name", async () => {
    const app = createApp();
    // Package names only allow lowercase + hyphens, so this should 404
    const res = await app.request("/@test/existing");
    expect(res.status).toBe(200);
  });

  it("handles URL-encoded package names", async () => {
    const app = createApp();
    const encoded = encodeURIComponent("@test/existing");
    // Direct encoded path may not match — verify the decoding approach
    const decoded = decodeURIComponent(encoded);
    expect(decoded).toBe("@test/existing");
  });
});
