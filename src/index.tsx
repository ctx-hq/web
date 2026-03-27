import { Hono } from "hono";
import { Marked } from "marked";
import { Layout } from "./layout";
import { ApiClient, ApiError } from "./lib/api-client";
import { defaultMeta, searchMeta, packageMeta, docsMeta, escapeHtml } from "./lib/seo";
import { SITE_NAME, SITE_URL } from "./lib/constants";
import type { PackageSummary, PackageType, SearchResult } from "./lib/types";

import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { PackageDetailPage } from "./pages/package-detail";
import { DocsPage, VALID_DOC_SECTIONS } from "./pages/docs";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";

type Env = {
  Bindings: {
    API_BASE_URL: string;
    GITHUB_CLIENT_ID?: string;
  };
};

const app = new Hono<Env>();

function api(c: { env: Env["Bindings"] }) {
  return new ApiClient(c.env.API_BASE_URL || "https://api.getctx.org");
}

/** Only allow safe URL schemes in markdown links/images. */
function sanitizeUrl(href: string): string {
  try {
    const url = new URL(href, "https://placeholder.invalid");
    if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:") {
      return href;
    }
  } catch { /* invalid URL */ }
  return "";
}

/** Marked instance with raw HTML escaped and dangerous URL schemes stripped. */
const safeMarked = new Marked();
safeMarked.use({
  renderer: {
    html(token) {
      return escapeHtml(token.text);
    },
    link(token) {
      const href = sanitizeUrl(token.href);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return href
        ? `<a href="${escapeHtml(href)}"${title}>${token.text}</a>`
        : escapeHtml(token.text);
    },
    image(token) {
      const src = sanitizeUrl(token.href);
      const alt = escapeHtml(token.text);
      const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
      return src
        ? `<img src="${escapeHtml(src)}" alt="${alt}"${title} />`
        : alt;
    },
  },
});

// Home
app.get("/", async (c) => {
  let trending: { packages: PackageSummary[]; total: number } = { packages: [], total: 0 };
  try {
    trending = await api(c).listPackages({ sort: "downloads", limit: 12 });
  } catch {
    // API unavailable — render with empty list
  }
  const meta = defaultMeta();
  return c.html(
    <Layout meta={meta}>
      <HomePage trending={trending.packages} />
    </Layout>
  );
});

// Search
app.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  const rawType = c.req.query("type");
  const validTypes: PackageType[] = ["skill", "mcp", "cli"];
  const type: PackageType | undefined = validTypes.includes(rawType as PackageType)
    ? (rawType as PackageType)
    : undefined;

  let result: SearchResult = { packages: [], total: 0 };
  if (query) {
    try {
      result = await api(c).search(query, { type, limit: 30 });
    } catch {
      // API unavailable
    }
  } else if (type) {
    try {
      const listed = await api(c).listPackages({ type, limit: 30 });
      result = { packages: listed.packages, total: listed.total };
    } catch {
      // API unavailable
    }
  }

  const meta = searchMeta(query || (type ? `type:${type}` : "all"));
  return c.html(
    <Layout meta={meta}>
      <SearchPage query={query} type={type} packages={result.packages} total={result.total} />
    </Layout>
  );
});

// Package detail: /@scope/name
app.get("/:fullName{@[^/]+/[^/]+}", async (c) => {
  const fullName = c.req.param("fullName").slice(1); // strip leading @

  try {
    const pkg = await api(c).getPackage(fullName);

    let readmeHtml = "";
    if (pkg.versions.length > 0) {
      try {
        const ver = await api(c).getVersion(fullName, pkg.versions[0].version);
        if (ver.readme) {
          readmeHtml = await safeMarked.parse(ver.readme);
        }
      } catch {
        // No readme available
      }
    }

    const meta = packageMeta(pkg);
    return c.html(
      <Layout meta={meta}>
        <PackageDetailPage pkg={pkg} readmeHtml={readmeHtml} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }}>
          <div class="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 class="mb-2 text-lg font-semibold">Package not found</h1>
            <p class="text-muted-foreground">@{fullName} does not exist.</p>
          </div>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Docs
app.get("/docs", (c) => {
  const meta = docsMeta();
  return c.html(
    <Layout meta={meta}>
      <DocsPage />
    </Layout>
  );
});

app.get("/docs/:section", (c) => {
  const section = c.req.param("section");
  if (!VALID_DOC_SECTIONS.includes(section)) {
    return c.notFound();
  }
  const meta = docsMeta(section);
  return c.html(
    <Layout meta={meta}>
      <DocsPage section={section} />
    </Layout>
  );
});

// Login
app.get("/login", (c) => {
  const state = crypto.randomUUID();
  c.header("Set-Cookie", `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  const meta = { ...defaultMeta(), title: `Sign in — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta}>
      <LoginPage githubClientId={c.env.GITHUB_CLIENT_ID} oauthState={state} />
    </Layout>
  );
});

// Dashboard
app.get("/dashboard", async (c) => {
  // TODO: check auth cookie, redirect to /login if absent
  const meta = { ...defaultMeta(), title: `Dashboard — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta}>
      <DashboardPage username="guest" packages={[]} />
    </Layout>
  );
});

// Search suggest API proxy (avoids CORS)
app.get("/api/search-suggest", async (c) => {
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
app.get("/sitemap.xml", async (c) => {
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
      (p) => `<url><loc>${SITE_URL}/@${escapeHtml(p.full_name)}</loc><priority>0.6</priority></url>`
    ),
  ];

  c.header("Content-Type", "application/xml");
  c.header("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return c.body(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`
  );
});

// Robots.txt
app.get("/robots.txt", (c) => {
  c.header("Content-Type", "text/plain");
  c.header("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return c.body(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
});

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.html(
    <Layout meta={{ ...defaultMeta(), title: `Error — ${SITE_NAME}` }}>
      <div class="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 class="mb-2 text-lg font-semibold">Something went wrong</h1>
        <p class="text-muted-foreground">Please try again later.</p>
      </div>
    </Layout>,
    500
  );
});

export default app;
