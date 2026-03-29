import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Marked } from "marked";
import { Layout } from "./layout";
import { ApiClient, ApiError } from "./lib/api-client";
import { defaultMeta, searchMeta, packageMeta, docsMeta, escapeHtml } from "./lib/seo";
import { SITE_NAME, SITE_URL } from "./lib/constants";
import type { SessionUser, PackageSummary, PackageType, SortOption, SearchResult, ManifestInfo, OrgInfo, OrgMember, SyncProfileMeta, AgentRanking, RegistryOverview } from "./lib/types";
import { parseManifest } from "./lib/types";
import { validateSort } from "./lib/search-url";
import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { PackageDetailPage } from "./pages/package-detail";
import { DocsPage, VALID_DOC_SECTIONS } from "./pages/docs";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { PrivacyPage } from "./pages/privacy";
import { PublisherPage } from "./pages/publisher";
import { OrgPage } from "./pages/org";
import { StatsPage } from "./pages/stats";
import { PackageStatsPage } from "./pages/package-stats";
import { DeviceLoginPage } from "./pages/device-login";
import { CreateOrgPage, validateOrgName } from "./pages/create-org";

type Env = {
  Bindings: {
    API_BASE_URL: string;
    GITHUB_CLIENT_ID?: string;
  };
  Variables: {
    user: SessionUser | null;
    token: string | null;
  };
};

const app = new Hono<Env>();

// ── Security headers middleware ──────────────────────────────────────────────
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  );
});

// ── Auth middleware — resolve session once for all HTML routes (SSOT) ────────
app.use("*", async (c, next) => {
  const path = c.req.path;
  // Skip non-HTML routes that don't render Layout
  if (
    path.startsWith("/api/") ||
    path === "/sitemap.xml" ||
    path === "/robots.txt" ||
    path === "/skill.md" ||
    path.startsWith("/install.")
  ) {
    c.set("user", null);
    c.set("token", null);
    return next();
  }

  // No session cookie → skip the API call entirely
  const cookie = getCookie(c, "__Host-ctx_session");
  if (!cookie) {
    c.set("user", null);
    c.set("token", null);
    return next();
  }

  // Cookie exists — always set Vary so CDN never conflates anon/auth variants,
  // even if resolveUser fails (timeout, 5xx).
  c.header("Vary", "Cookie");

  const session = await resolveUser(c, cookie);
  c.set("user", session?.user ?? null);
  c.set("token", session?.token ?? null);

  await next();

  // Authenticated response: override any route-level public cache header
  // to prevent CDN from serving personalized content to other users.
  if (session) {
    c.header("Cache-Control", "private, no-store");
  }
});

function api(c: { env: Env["Bindings"] }) {
  const base = c.env.API_BASE_URL;
  if (!base) throw new Error("API_BASE_URL environment variable is required");
  return new ApiClient(base);
}

/** Validate redirect path: must be relative, no protocol, no double-slash (open redirect prevention). */
function isSafeRedirect(path: string | undefined): path is string {
  if (!path) return false;
  return path.startsWith("/") && !path.startsWith("//") && !/^\/[\\]/.test(path) && !path.includes(":");
}

/** Resolve session user from token. Returns null on invalid/expired session. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUser(c: any, token: string): Promise<{ user: SessionUser; token: string } | null> {
  try {
    const apiBase: string = c.env.API_BASE_URL;
    const resp = await fetch(`${apiBase}/v1/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(3_000),
    });
    if (resp.ok) {
      const data = (await resp.json()) as SessionUser;
      return { user: data, token };
    }
    // Expired/revoked session — clear stale cookie to avoid repeated /v1/me calls
    if (resp.status === 401 || resp.status === 403) {
      deleteCookie(c, "__Host-ctx_session", { path: "/", secure: true });
    }
  } catch {
    // Network error or timeout — treat as logged out but keep cookie for retry
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
  let apiError = false;
  try {
    trending = await api(c).listPackages({ sort: "downloads", limit: 12 }, c.get("token"));
  } catch (e) {
    apiError = true;
    console.error("Home: failed to fetch trending packages", e);
  }
  const meta = defaultMeta();
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return c.html(
    <Layout meta={meta} currentPath="/" user={c.get("user")}>
      <HomePage trending={trending.packages} apiError={apiError} />
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
  let apiError = false;
  if (query) {
    try {
      result = await api(c).search(query, { type, limit: PAGE_SIZE, offset }, c.get("token"));
    } catch (e) {
      apiError = true;
      console.error("Search: failed to fetch results", e);
    }
  } else {
    try {
      const sortParam = sort === "newest" ? "created_at" : undefined;
      const listed = await api(c).listPackages({ type, sort: sortParam, limit: PAGE_SIZE, offset }, c.get("token"));
      result = { packages: listed.packages, total: listed.total };
    } catch (e) {
      apiError = true;
      console.error("Browse: failed to list packages", e);
    }
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
    <Layout meta={meta} currentPath="/search" user={c.get("user")}>
      <SearchPage
        query={query}
        type={type}
        sort={sort}
        packages={result.packages}
        total={result.total}
        page={page}
        totalPages={totalPages}
        apiError={apiError}
      />
    </Layout>
  );
});

// Agent-readable .ctx endpoint: proxy to API (respects package visibility)
app.get("/:fullName{@[^/]+/[^/]+\\.ctx}", async (c) => {
  const fullName = c.req.param("fullName").replace(/\.ctx$/, "");
  const apiBase = c.env.API_BASE_URL;
  const token = c.get("token");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${apiBase}/${fullName}.ctx`, {
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return c.text(`Package ${fullName} not found`, 404);
    c.header("Content-Type", "text/plain; charset=utf-8");
    // Private packages: no public caching
    if (token) {
      c.header("Cache-Control", "private, no-store");
    } else {
      c.header("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    }
    return c.text(await res.text());
  } catch {
    return c.text("Service temporarily unavailable", 502);
  }
});

// Package stats: /@scope/name/stats
app.get("/:fullName{@[^/]+/[^/]+}/stats", async (c) => {
  const fullName = c.req.param("fullName");
  try {
    const stats = await api(c).getPackageStats(fullName, c.get("token"));
    const meta = { ...defaultMeta(), title: `${fullName} Stats — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/${fullName}/stats`} user={c.get("user")}>
        <PackageStatsPage fullName={fullName} stats={stats} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <div class="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 class="mb-2 text-base font-semibold font-heading">Package not found</h1>
            <p class="text-xs text-muted-foreground">{fullName} does not exist.</p>
          </div>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Package detail: /@scope/name
app.get("/:fullName{@[^/]+/[^/]+}", async (c) => {
  const fullName = c.req.param("fullName");

  try {
    const pkg = await api(c).getPackage(fullName, c.get("token"));

    let readmeHtml = "";
    let manifestInfo: ManifestInfo | null = null;
    if (pkg.versions.length > 0) {
      try {
        const ver = await api(c).getVersion(fullName, pkg.versions[0].version, c.get("token"));
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
      <Layout meta={meta} currentPath={`/${fullName}`} user={c.get("user")}>
        <PackageDetailPage pkg={pkg} readmeHtml={readmeHtml} manifest={manifestInfo} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <div class="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 class="mb-2 text-base font-semibold font-heading">Package not found</h1>
            <p class="text-xs text-muted-foreground">{fullName} does not exist.</p>
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
    <Layout meta={meta} currentPath="/docs" user={c.get("user")}>
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
    <Layout meta={meta} currentPath={`/docs/${section}`} user={c.get("user")}>
      <DocsPage section={section} />
    </Layout>
  );
});

// Login — redirect to dashboard if already signed in
app.get("/login", async (c) => {
  const redirect = c.req.query("redirect");
  if (c.get("user")) {
    return c.redirect(isSafeRedirect(redirect) ? redirect! : "/dashboard");
  }
  const state = crypto.randomUUID();
  setCookie(c, "__Host-oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });
  // Store redirect destination for post-login
  if (isSafeRedirect(redirect)) {
    setCookie(c, "__Host-oauth_redirect", redirect!, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 600,
    });
  }
  const meta = { ...defaultMeta(), title: `Sign in — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/login" user={c.get("user")}>
      <LoginPage githubClientId={c.env.GITHUB_CLIENT_ID} oauthState={state} />
    </Layout>
  );
});

// OAuth callback — forward code to API (SSOT: API owns GitHub exchange)
app.get("/login/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");

  /** Clean up transient OAuth cookies on every exit path. */
  const clearOAuthCookies = () => {
    deleteCookie(c, "__Host-oauth_state", { path: "/", secure: true });
    deleteCookie(c, "__Host-oauth_redirect", { path: "/", secure: true });
  };

  if (!code || !state) {
    clearOAuthCookies();
    return c.redirect("/login");
  }

  // Verify state matches cookie
  const savedState = getCookie(c, "__Host-oauth_state");
  if (!savedState || savedState !== state) {
    clearOAuthCookies();
    return c.redirect("/login");
  }

  try {
    // Forward code to API — API handles GitHub token exchange, user upsert, session creation
    const apiBase = c.env.API_BASE_URL;
    const registerResp = await fetch(`${apiBase}/v1/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const session = await registerResp.json() as { token?: string; error?: string };
    if (!session.token) {
      clearOAuthCookies();
      return c.redirect("/login");
    }

    // Set session cookie
    setCookie(c, "__Host-ctx_session", session.token, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 2592000,
    });

    // Honor redirect destination from login flow, then clean up
    const redirect = getCookie(c, "__Host-oauth_redirect") as string | undefined;
    clearOAuthCookies();

    return c.redirect(isSafeRedirect(redirect) ? redirect : "/dashboard");
  } catch {
    clearOAuthCookies();
    return c.redirect("/login");
  }
});

// Logout — clear session cookie and redirect
app.get("/logout", (c) => {
  deleteCookie(c, "__Host-ctx_session", { path: "/", secure: true });
  return c.redirect("/");
});

// Device login — authorize a CLI device code
app.get("/login/device", async (c) => {
  const code = c.req.query("code") ?? "";

  if (!c.get("user")) {
    const redirectPath = code
      ? `/login/device?code=${encodeURIComponent(code)}`
      : "/login/device";
    return c.redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const meta = { ...defaultMeta(), title: `Authorize Device — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/login/device" user={c.get("user")}>
      <DeviceLoginPage code={code} />
    </Layout>
  );
});

// Device authorize proxy — forwards to API (avoids CORS / exposing API_BASE_URL).
// Starts with /api/ so auth middleware skips it; reads cookie directly.
app.post("/api/device/authorize", async (c) => {
  const token = getCookie(c, "__Host-ctx_session") as string | undefined;
  if (!token) {
    return c.json({ error: "unauthorized", message: "Not signed in" }, 401);
  }

  let body: { user_code?: string };
  try {
    body = await c.req.json<{ user_code?: string }>();
  } catch {
    return c.json({ error: "bad_request", message: "Invalid request body" }, 400);
  }

  try {
    const apiBase = c.env.API_BASE_URL;
    const resp = await fetch(`${apiBase}/v1/auth/device/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_code: body.user_code }),
    });

    const data = await resp.json();
    return c.json(data, resp.status as any);
  } catch {
    return c.json({ error: "server_error", message: "Unable to reach authorization service" }, 502);
  }
});

// Create Organization (auth required)
app.get("/orgs/new", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/login?redirect=/orgs/new");
  }
  const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/orgs/new" user={user}>
      <CreateOrgPage />
    </Layout>
  );
});

app.post("/orgs/new", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) {
    return c.redirect("/login?redirect=/orgs/new");
  }

  const body = await c.req.parseBody();
  const name = String(body.name ?? "").trim();
  const displayName = String(body.display_name ?? "").trim() || undefined;

  // Server-side validation
  const nameError = validateOrgName(name);
  if (nameError) {
    const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath="/orgs/new" user={user}>
        <CreateOrgPage
          fieldErrors={{ name: nameError }}
          values={{ name, display_name: displayName }}
        />
      </Layout>,
      422,
    );
  }

  try {
    await api(c).createOrg(name, displayName, token);
    return c.redirect(`/org/${encodeURIComponent(name)}`);
  } catch (err) {
    let errorMsg = "Failed to create organization. Please try again.";
    if (err instanceof ApiError) {
      const apiMsg = err.body?.message;
      errorMsg = (typeof apiMsg === "string" && apiMsg) || err.message || errorMsg;
    }

    const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath="/orgs/new" user={user}>
        <CreateOrgPage
          error={errorMsg}
          values={{ name, display_name: displayName }}
        />
      </Layout>,
      422,
    );
  }
});

// Dashboard (auth required)
app.get("/dashboard", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) {
    return c.redirect("/login");
  }

  const rawTab = c.req.query("tab");
  const activeTab = rawTab && ["packages", "orgs", "sync"].includes(rawTab) ? rawTab : "packages";

  // Fetch the user's published packages via publisher API
  let packages: PackageSummary[] = [];
  try {
    const pkgResult = await api(c).getPublisherPackages(user.username, { limit: 50 }, token);
    packages = pkgResult.packages;
  } catch {
    // Non-critical — show dashboard with empty list
  }

  // Fetch orgs if on orgs tab
  let orgs: OrgInfo[] = [];
  if (activeTab === "orgs") {
    try {
      const result = await api(c).getMyOrgs(token);
      orgs = result.orgs;
    } catch {
      // Non-critical
    }
  }

  // Fetch sync profile if on sync tab
  let syncMeta: SyncProfileMeta | null = null;
  if (activeTab === "sync") {
    try {
      const result = await api(c).getSyncProfile(token);
      syncMeta = result.meta;
    } catch {
      // Non-critical
    }
  }

  const meta = { ...defaultMeta(), title: `Dashboard — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/dashboard" user={user}>
      <DashboardPage
        username={user.username}
        packages={packages}
        orgs={orgs}
        syncMeta={syncMeta}
        activeTab={activeTab}
      />
    </Layout>
  );
});

// Publisher profile
app.get("/publisher/:slug", async (c) => {
  const slug = c.req.param("slug");
  try {
    const [publisher, pkgResult] = await Promise.all([
      api(c).getPublisher(slug),
      api(c).getPublisherPackages(slug, { limit: 50 }, c.get("token")),
    ]);
    const meta = { ...defaultMeta(), title: `@${slug} — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/publisher/${slug}`} user={c.get("user")}>
        <PublisherPage publisher={publisher} packages={pkgResult.packages} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <div class="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 class="mb-2 text-base font-semibold font-heading">Publisher not found</h1>
            <p class="text-xs text-muted-foreground">@{slug} does not exist.</p>
          </div>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Organization page
app.get("/org/:name", async (c) => {
  const name = c.req.param("name");
  try {
    const [org, pkgResult] = await Promise.all([
      api(c).getOrg(name),
      api(c).getOrgPackages(name, c.get("token")),
    ]);

    // Members require auth — best-effort
    let members: OrgMember[] | null = null;
    const token = c.get("token");
    if (token) {
      try {
        const result = await api(c).getOrgMembers(name, token);
        members = result.members;
      } catch {
        // Not a member or API error — leave as null to show appropriate message
      }
    }

    const meta = { ...defaultMeta(), title: `${org.display_name || org.name} — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/org/${name}`} user={c.get("user")}>
        <OrgPage org={org} members={members} packages={pkgResult.packages} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <div class="mx-auto max-w-5xl px-4 py-16 text-center">
            <h1 class="mb-2 text-base font-semibold font-heading">Organization not found</h1>
            <p class="text-xs text-muted-foreground">{name} does not exist.</p>
          </div>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Stats page
app.get("/stats", async (c) => {
  let agents: AgentRanking[] = [];
  let trending: PackageSummary[] = [];
  let overview: RegistryOverview | null = null;
  const results = await Promise.allSettled([
    api(c).getAgentRankings(),
    api(c).getTrending(12, c.get("token")),
    api(c).getRegistryOverview(),
  ]);
  if (results[0].status === "fulfilled") agents = results[0].value.agents;
  if (results[1].status === "fulfilled") trending = results[1].value.packages;
  if (results[2].status === "fulfilled") overview = results[2].value;
  for (const r of results) {
    if (r.status === "rejected" && r.reason instanceof ApiError && r.reason.status >= 500) {
      console.error("Stats: upstream error", r.reason.status);
    }
  }

  const meta = { ...defaultMeta(), title: `Stats — ${SITE_NAME}` };
  c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return c.html(
    <Layout meta={meta} currentPath="/stats" user={c.get("user")}>
      <StatsPage overview={overview} agents={agents} trending={trending} />
    </Layout>
  );
});

// Privacy policy
app.get("/privacy", (c) => {
  const meta = { ...defaultMeta(), title: `Privacy Policy — ${SITE_NAME}` };
  c.header("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return c.html(
    <Layout meta={meta} currentPath="/privacy" user={c.get("user")}>
      <PrivacyPage />
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
      (p) => `<url><loc>${SITE_URL}/${escapeHtml(p.full_name)}</loc><priority>0.6</priority></url>`
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
app.get("/skill.md", async (c) => {
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

// Error handler — log message only (no stack traces / internal URLs in production logs)
app.onError((err, c) => {
  console.error("Unhandled error:", err instanceof Error ? err.message : "unknown");
  return c.html(
    <Layout meta={{ ...defaultMeta(), title: `Error — ${SITE_NAME}` }} user={c.get("user") ?? null}>
      <div class="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 class="mb-2 text-base font-semibold font-heading">Something went wrong</h1>
        <p class="text-xs text-muted-foreground">Please try again later.</p>
      </div>
    </Layout>,
    500
  );
});

export default app;
