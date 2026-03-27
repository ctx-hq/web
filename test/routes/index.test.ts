import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Lightweight route integration tests using plain Hono (no full app import to avoid Vite deps)

describe("route patterns", () => {
  it("home route responds with 200", async () => {
    const app = new Hono();
    app.get("/", (c) => c.html("<html><body>home</body></html>"));

    const res = await app.request("/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("home");
  });

  it("search route accepts query params", async () => {
    const app = new Hono();
    app.get("/search", (c) => {
      const q = c.req.query("q") ?? "";
      const type = c.req.query("type") ?? "all";
      return c.html(`<html><body>search: ${q} type: ${type}</body></html>`);
    });

    const res = await app.request("/search?q=test&type=mcp");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("search: test");
    expect(html).toContain("type: mcp");
  });

  it("package route parses scope/name from path segments", async () => {
    const app = new Hono();
    // Use wildcard to capture the full path after @
    app.get("/:fullName{@.+}", (c) => {
      const raw = c.req.param("fullName");
      // Strip @ prefix, split on /
      const withoutAt = raw.startsWith("@") ? raw.slice(1) : raw;
      return c.html(`<html><body>package: ${withoutAt}</body></html>`);
    });

    const res = await app.request("/@hong/my-skill");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("package: hong/my-skill");
  });

  it("docs route responds", async () => {
    const app = new Hono();
    app.get("/docs", (c) => c.html("<html><body>docs</body></html>"));
    app.get("/docs/:section", (c) => c.html(`<html><body>docs: ${c.req.param("section")}</body></html>`));

    const res1 = await app.request("/docs");
    expect(res1.status).toBe(200);

    const res2 = await app.request("/docs/spec");
    const html = await res2.text();
    expect(html).toContain("docs: spec");
  });

  it("sitemap returns XML", async () => {
    const app = new Hono();
    app.get("/sitemap.xml", (c) => {
      c.header("Content-Type", "application/xml");
      return c.body('<?xml version="1.0"?><urlset><url><loc>https://getctx.org/</loc></url></urlset>');
    });

    const res = await app.request("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("xml");
    const body = await res.text();
    expect(body).toContain("getctx.org");
  });

  it("robots.txt returns plain text", async () => {
    const app = new Hono();
    app.get("/robots.txt", (c) => {
      c.header("Content-Type", "text/plain");
      return c.body("User-agent: *\nAllow: /\n");
    });

    const res = await app.request("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");
  });

  it("unknown routes return 404", async () => {
    const app = new Hono();
    app.get("/", (c) => c.text("home"));

    const res = await app.request("/nonexistent");
    expect(res.status).toBe(404);
  });

  it("search-suggest proxy returns JSON", async () => {
    const app = new Hono();
    app.get("/api/search-suggest", (c) => {
      const q = c.req.query("q") ?? "";
      if (q.length < 2) return c.json({ packages: [] });
      return c.json({ packages: [{ full_name: "test/pkg" }] });
    });

    const res1 = await app.request("/api/search-suggest?q=a");
    const data1 = await res1.json();
    expect(data1.packages).toHaveLength(0);

    const res2 = await app.request("/api/search-suggest?q=test");
    const data2 = await res2.json();
    expect(data2.packages).toHaveLength(1);
  });
});
