import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Marked } from "marked";
import { Layout } from "./layout";
import { ApiClient, ApiError } from "./lib/api-client";
import { defaultMeta, searchMeta, packageMeta, docsMeta, escapeHtml } from "./lib/seo";
import { SITE_NAME, SITE_URL } from "./lib/constants";
import type { SessionUser, PackageSummary, PackageType, SortOption, SearchResult, ManifestInfo } from "./lib/types";
import { parseManifest } from "./lib/types";
import { validateSort } from "./lib/search-url";
// Lazy-load mock data so it's tree-shaken from production builds when unused.
// TODO: Remove before production launch.
async function loadMock() {
  return import("./lib/mock-data");
}

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
    GITHUB_CLIENT_SECRET?: string;
    ENABLE_MOCK_DATA?: string; // Set to "true" in dev/staging only
  };
};

const app = new Hono<Env>();

function api(c: { env: Env["Bindings"] }) {
  return new ApiClient(c.env.API_BASE_URL || "https://api.getctx.org");
}

/** Resolve session user from cookie. Only call in auth-required routes. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUser(c: any): Promise<{ user: SessionUser; token: string } | null> {
  const token = getCookie(c, "ctx_session") as string | undefined;
  if (!token) return null;
  try {
    const apiBase: string = c.env.API_BASE_URL || "https://api.getctx.org";
    const resp = await fetch(`${apiBase}/v1/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(3_000),
    });
    if (resp.ok) {
      const data = (await resp.json()) as SessionUser;
      return { user: data, token };
    }
  } catch {
    // Session invalid or API down — treat as logged out
  }
  return null;
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
  let apiAvailable = true;
  try {
    trending = await api(c).listPackages({ sort: "downloads", limit: 12 });
  } catch {
    apiAvailable = false;
  }
  if (!apiAvailable && trending.packages.length === 0 && c.env.ENABLE_MOCK_DATA === "true") {
    trending = (await loadMock()).queryMockPackages({ sort: "downloads", limit: 12 });
  }
  const meta = defaultMeta();
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return c.html(
    <Layout meta={meta} currentPath="/">
      <HomePage trending={trending.packages} />
    </Layout>
  );
});

// Search & Browse
app.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  const rawType = c.req.query("type");
  const validTypes: PackageType[] = ["skill", "mcp", "cli"];
  const type: PackageType | undefined = validTypes.includes(rawType as PackageType)
    ? (rawType as PackageType)
    : undefined;
  const sort: SortOption = validateSort(c.req.query("sort"));

  const PAGE_SIZE = 30;
  const rawPage = parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const offset = (page - 1) * PAGE_SIZE;

  let result: SearchResult = { packages: [], total: 0 };
  let searchApiAvailable = true;
  if (query) {
    // Search API (relevance-ranked, sort not supported)
    try {
      result = await api(c).search(query, { type, limit: PAGE_SIZE, offset });
    } catch {
      searchApiAvailable = false;
    }
  } else {
    // Browse mode: list all packages with optional type filter and sort
    try {
      const sortParam = sort === "newest" ? "created_at" : undefined;
      const listed = await api(c).listPackages({ type, sort: sortParam, limit: PAGE_SIZE, offset });
      result = { packages: listed.packages, total: listed.total };
    } catch {
      searchApiAvailable = false;
    }
  }
  if (!searchApiAvailable && c.env.ENABLE_MOCK_DATA === "true") {
    const sortParam = sort === "newest" ? "newest" : undefined;
    result = (await loadMock()).queryMockPackages({ q: query || undefined, type, sort: sortParam, limit: PAGE_SIZE, offset });
  }

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  // Clamp: if page exceeds totalPages (and there are results), redirect to last valid page
  if (page > totalPages && result.total > 0) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (sort !== "downloads") params.set("sort", sort);
    if (totalPages > 1) params.set("page", String(totalPages));
    const qs = params.toString();
    return c.redirect(qs ? `/search?${qs}` : "/search");
  }

  const meta = searchMeta(query, { type });
  c.header("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return c.html(
    <Layout meta={meta} currentPath="/search">
      <SearchPage
        query={query}
        type={type}
        sort={sort}
        packages={result.packages}
        total={result.total}
        page={page}
        totalPages={totalPages}
      />
    </Layout>
  );
});

// Package detail: /@scope/name
app.get("/:fullName{@[^/]+/[^/]+}", async (c) => {
  const fullName = c.req.param("fullName").slice(1); // strip leading @

  try {
    const pkg = await api(c).getPackage(fullName);

    let readmeHtml = "";
    let manifestInfo: ManifestInfo | null = null;
    if (pkg.versions.length > 0) {
      try {
        const ver = await api(c).getVersion(fullName, pkg.versions[0].version);
        if (ver.readme) {
          readmeHtml = await safeMarked.parse(ver.readme);
        }
        manifestInfo = parseManifest(ver.manifest);
      } catch {
        // No readme/manifest available
      }
    }

    const meta = packageMeta(pkg);
    c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return c.html(
      <Layout meta={meta} currentPath={`/@${fullName}`}>
        <PackageDetailPage pkg={pkg} readmeHtml={readmeHtml} manifest={manifestInfo} />
      </Layout>
    );
  } catch (err) {
    // Try mock fallback for both 404 and network errors when mock data is enabled
    if (c.env.ENABLE_MOCK_DATA === "true") {
      const mock = (await loadMock()).getMockPackageDetail(fullName);
      if (mock) {
        const readmeHtml = mock.readme ? await safeMarked.parse(mock.readme) : "";
        const meta = packageMeta(mock.pkg);
        c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
        return c.html(
          <Layout meta={meta} currentPath={`/@${fullName}`}>
            <PackageDetailPage pkg={mock.pkg} readmeHtml={readmeHtml} manifest={mock.manifest} />
          </Layout>
        );
      }
    }
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }}>
          <div class="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 class="mb-2 text-base font-semibold font-heading">Package not found</h1>
            <p class="text-xs text-muted-foreground">@{fullName} does not exist.</p>
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
  c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
  return c.html(
    <Layout meta={meta} currentPath="/docs">
      <DocsPage />
    </Layout>
  );
});

app.get("/docs/:section", (c) => {
  const section = c.req.param("section");
  if (!VALID_DOC_SECTIONS.includes(section as typeof VALID_DOC_SECTIONS[number])) {
    return c.notFound();
  }
  const meta = docsMeta(section);
  c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
  return c.html(
    <Layout meta={meta} currentPath={`/docs/${section}`}>
      <DocsPage section={section} />
    </Layout>
  );
});

// Login — redirect to dashboard if already signed in
app.get("/login", async (c) => {
  const session = await resolveUser(c);
  if (session) {
    return c.redirect("/dashboard");
  }
  const state = crypto.randomUUID();
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });
  const meta = { ...defaultMeta(), title: `Sign in — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/login">
      <LoginPage githubClientId={c.env.GITHUB_CLIENT_ID} oauthState={state} />
    </Layout>
  );
});

// OAuth callback — exchange GitHub code for user session
app.get("/login/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  if (!code || !state) {
    return c.redirect("/login");
  }

  // Verify state matches cookie
  const savedState = getCookie(c, "oauth_state");
  if (!savedState || savedState !== state) {
    return c.redirect("/login");
  }

  const clientId = c.env.GITHUB_CLIENT_ID;
  const clientSecret = c.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return c.redirect("/login");
  }

  try {
    // Exchange code for GitHub access token
    const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResp.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return c.redirect("/login");
    }

    // Get user profile from GitHub (including email)
    const userResp = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
        "User-Agent": "getctx.org",
      },
    });
    const ghUser = await userResp.json() as {
      id: number;
      login: string;
      email: string | null;
      avatar_url: string;
    };

    // If email not public, fetch from /user/emails
    let email = ghUser.email ?? "";
    if (!email) {
      const emailsResp = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
          "User-Agent": "getctx.org",
        },
      });
      const emails = await emailsResp.json() as Array<{ email: string; primary: boolean; verified: boolean }>;
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email ?? emails[0]?.email ?? "";
    }

    // Register/login user via our API
    const apiBase = c.env.API_BASE_URL || "https://api.getctx.org";
    const registerResp = await fetch(`${apiBase}/v1/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        github_id: String(ghUser.id),
        username: ghUser.login,
        email,
        avatar_url: ghUser.avatar_url,
      }),
    });

    const session = await registerResp.json() as { token?: string; error?: string };
    if (!session.token) {
      return c.redirect("/login");
    }

    // Set session cookie and clear oauth_state
    setCookie(c, "ctx_session", session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 2592000,
    });
    deleteCookie(c, "oauth_state", { path: "/" });

    return c.redirect("/dashboard");
  } catch {
    return c.redirect("/login");
  }
});

// Logout — clear session cookie and redirect
app.get("/logout", (c) => {
  deleteCookie(c, "ctx_session", { path: "/" });
  return c.redirect("/");
});

// Dashboard (auth required)
app.get("/dashboard", async (c) => {
  const session = await resolveUser(c);
  if (!session) {
    return c.redirect("/login");
  }

  const { user, token: sessionToken } = session;
  const apiBase = c.env.API_BASE_URL || "https://api.getctx.org";

  // Fetch the user's published packages
  let packages: PackageSummary[] = [];
  try {
    const pkgResp = await fetch(`${apiBase}/v1/users/${encodeURIComponent(user.username)}/packages?limit=50`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${sessionToken}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (pkgResp.ok) {
      const data = (await pkgResp.json()) as { packages: PackageSummary[] };
      packages = data.packages;
    }
  } catch {
    // Non-critical — show dashboard with empty list
  }

  const meta = { ...defaultMeta(), title: `Dashboard — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/dashboard" user={user}>
      <DashboardPage username={user.username} packages={packages} />
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

// Install script proxy — serves scripts from GitHub raw with edge caching
// SSOT: scripts live in ctx/scripts/ (Git), this route is a transparent proxy
const INSTALL_SCRIPTS: Record<string, string> = {
  "install.sh": "https://raw.githubusercontent.com/ctx-hq/ctx/main/scripts/install.sh",
  "install.ps1": "https://raw.githubusercontent.com/ctx-hq/ctx/main/scripts/install.ps1",
};

async function proxyInstallScript(
  c: { header: (k: string, v: string) => void; body: (b: string, status?: number) => Response },
  filename: string,
): Promise<Response> {
  const url = INSTALL_SCRIPTS[filename];
  if (!url) {
    return c.body("Not found", 404);
  }

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "getctx.org/install-proxy" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok) {
      c.header("Content-Type", "text/plain; charset=utf-8");
      return c.body(
        `# Failed to fetch install script (upstream returned ${upstream.status}).\n` +
        `# Try the direct URL instead:\n` +
        `#   ${url}\n`,
        502,
      );
    }

    const body = await upstream.text();

    c.header("Content-Type", "text/plain; charset=utf-8");
    c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Robots-Tag", "noindex, nofollow");
    return c.body(body);
  } catch {
    c.header("Content-Type", "text/plain; charset=utf-8");
    return c.body(
      `# Install script temporarily unavailable.\n` +
      `# Try the direct URL instead:\n` +
      `#   ${url}\n`,
      502,
    );
  }
}

app.get("/install.sh", (c) => proxyInstallScript(c, "install.sh"));
app.get("/install.ps1", (c) => proxyInstallScript(c, "install.ps1"));

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
        <h1 class="mb-2 text-base font-semibold font-heading">Something went wrong</h1>
        <p class="text-xs text-muted-foreground">Please try again later.</p>
      </div>
    </Layout>,
    500
  );
});

export default app;
