import { Hono } from "hono";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { escapeHtml } from "../lib/seo";
import { SITE_URL } from "../lib/constants";
import type { PackageSummary } from "../lib/types";
import { proxyInstallScript } from "../lib/install-proxy";

const route = new Hono<AppEnv>();

// Search suggest API proxy (avoids CORS)
route.get("/api/search-suggest", async (c) => {
  const q = c.req.query("q") ?? "";
  if (q.length < 2) return c.json({ packages: [] });
  try {
    const result = await api(c).search(q, { limit: 5 });
    return c.json(result);
  } catch {
    return c.json({ packages: [] });
  }
});

// Sitemap
route.get("/sitemap.xml", async (c) => {
  let packages: PackageSummary[] = [];
  try {
    const result = await api(c).listPackages({ limit: 1000 });
    packages = result.packages;
  } catch {
    // API unavailable
  }

  const urls = [
    `<url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>`,
    `<url><loc>${SITE_URL}/search</loc><priority>0.8</priority></url>`,
    `<url><loc>${SITE_URL}/docs</loc><priority>0.8</priority></url>`,
    ...packages.map(
      (p) => `<url><loc>${SITE_URL}/package/${escapeHtml(p.full_name)}</loc><priority>0.6</priority></url>`
    ),
  ];

  c.header("Content-Type", "application/xml");
  c.header("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`
  );
});

// Global skill.md — ctx's own SKILL.md for agents
// SSOT: skills/ctx/SKILL.md in the ctx repo
route.get("/skill.md", async (c) => {
  const url = "https://raw.githubusercontent.com/ctx-hq/ctx/main/skills/ctx/SKILL.md";
  c.header("Content-Type", "text/plain; charset=utf-8");
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "getctx.org/skill-proxy" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!upstream.ok) return c.body("# ctx skill temporarily unavailable\n", 502);
    c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return c.body(await upstream.text());
  } catch {
    return c.body("# ctx skill temporarily unavailable\n", 502);
  }
});

// Install script proxies
route.get("/install.sh", (c) => proxyInstallScript(c, "install.sh"));
route.get("/install.ps1", (c) => proxyInstallScript(c, "install.ps1"));

// Package-specific install script — proxied to API
// Usage: curl -fsSL https://getctx.org/install/@scope/package | sh
route.get("/install/@:scope/:name", async (c) => {
  const scope = c.req.param("scope");
  const name = c.req.param("name");
  try {
    const upstream = await fetch(
      `${c.env.API_BASE_URL}/v1/install/${encodeURIComponent(scope!)}/${encodeURIComponent(name!)}`,
      {
        headers: { "User-Agent": "getctx.org/install-proxy" },
        signal: AbortSignal.timeout(10_000),
      },
    );
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    };
    if (upstream.ok) {
      headers["Cache-Control"] = "public, s-maxage=300, stale-while-revalidate=600";
    }
    return new Response(await upstream.text(), { status: upstream.status, headers });
  } catch {
    return new Response("#!/bin/sh\necho 'Error: install script temporarily unavailable.' >&2\nexit 1\n", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
});

// Robots.txt
route.get("/robots.txt", (c) => {
  c.header("Content-Type", "text/plain");
  c.header("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return c.body(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

export default route;
