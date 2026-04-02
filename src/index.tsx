import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { Marked } from "marked";
import { Layout } from "./layout";
import { Container } from "./components/ui/container";
import { ApiClient, ApiError } from "./lib/api-client";
import { defaultMeta, searchMeta, packageMeta, docsMeta, escapeHtml } from "./lib/seo";
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "./lib/constants";
import type { SessionUser, PackageSummary, PackageType, SortOption, SearchResult, ManifestInfo, OrgInfo, OrgMember, OrgInvitation, SyncProfileMeta, AgentRanking, RegistryOverview, CategoryInfo, KeywordInfo, StarredPackage } from "./lib/types";
import { parseManifest } from "./lib/types";
import { validateSort } from "./lib/search-url";
import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { PackageDetailPage } from "./pages/package-detail";
import { PackageSettingsPage } from "./pages/package-settings";
import { DocsPage, VALID_DOC_SECTIONS } from "./pages/docs";
import { LoginPage } from "./pages/login";
import { DashboardPage } from "./pages/dashboard";
import { PrivacyPage } from "./pages/privacy";
import { ProfilePage } from "./pages/profile";
import { OrgPage } from "./pages/org";
import { StatsPage } from "./pages/stats";
import { PackageStatsPage } from "./pages/package-stats";
import { DeviceLoginPage } from "./pages/device-login";
import { CreateOrgPage, validateOrgName } from "./pages/create-org";
import { OrgSettingsPage } from "./pages/org-settings";
import { MCPHubPage } from "./pages/mcp-hub";
import { SubmitPage } from "./pages/submit";
import { SettingsTokensSection } from "./pages/settings-tokens";
import { SettingsPage } from "./pages/settings";
import type { SettingsTab } from "./pages/settings";

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

// ── CSRF protection — verify Origin/Referer on POST requests ────────────────
app.use("*", async (c, next) => {
  if (c.req.method === "POST") {
    const origin = c.req.header("Origin") || c.req.header("Referer");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        const siteUrl = new URL(SITE_URL);
        if (originUrl.host !== siteUrl.host) {
          return c.text("Forbidden: cross-origin POST", 403);
        }
      } catch {
        return c.text("Forbidden: invalid origin", 403);
      }
    }
    // If no Origin/Referer header, browsers always send Origin on POST forms.
    // Missing headers could indicate a non-browser client — allow for API compat.
  }
  await next();
});

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

/**
 * HTML tag allowlist for README rendering.
 * Only structurally safe tags are permitted — no script, iframe, form, etc.
 */
const ALLOWED_HTML_RE = /^<\/?(details|summary|br|hr|kbd|sup|sub|abbr|mark|del|ins|small|picture|source|video|audio|figcaption|figure|dl|dt|dd|table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col)(\s[^>]*)?\s*\/?>$/i;
const HTML_COMMENT_RE = /^<!--[\s\S]*?-->$/;

/** Marked instance with raw HTML filtered and dangerous URL schemes stripped. */
const safeMarked = new Marked();
safeMarked.use({
  renderer: {
    html(token) {
      const text = token.text.trim();
      // Strip HTML comments entirely
      if (HTML_COMMENT_RE.test(text)) return "";
      // Allow safe structural HTML tags
      if (ALLOWED_HTML_RE.test(text)) return token.text;
      // Multi-tag lines: allow if every tag in the line is safe
      const tags = text.match(/<\/?[a-z][^>]*>/gi);
      if (tags && tags.every(t => ALLOWED_HTML_RE.test(t.trim()))) return token.text;
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
  const category = c.req.query("category") ?? undefined;

  const PAGE_SIZE = 30;
  const rawPage = parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const offset = (page - 1) * PAGE_SIZE;

  let result: SearchResult = { packages: [], total: 0 };
  let categories: CategoryInfo[] = [];
  let keywords: KeywordInfo[] = [];
  let apiError = false;

  // Fetch categories and keywords in parallel with search results
  const sidePromises = Promise.allSettled([
    api(c).getCategories(),
    api(c).getKeywords(30),
  ]);

  if (query) {
    try {
      result = await api(c).search(query, { type, category, limit: PAGE_SIZE, offset }, c.get("token"));
    } catch (e) {
      apiError = true;
      console.error("Search: failed to fetch results", e);
    }
  } else {
    try {
      const sortParam = sort === "newest" ? "created_at" : undefined;
      const listed = await api(c).listPackages({ type, sort: sortParam, category, limit: PAGE_SIZE, offset }, c.get("token"));
      result = { packages: listed.packages, total: listed.total };
    } catch (e) {
      apiError = true;
      console.error("Browse: failed to list packages", e);
    }
  }

  // Resolve side data
  const sideResults = await sidePromises;
  if (sideResults[0].status === "fulfilled") categories = sideResults[0].value.categories ?? [];
  if (sideResults[1].status === "fulfilled") keywords = sideResults[1].value.keywords ?? [];

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  // Clamp: if page exceeds totalPages (and there are results), redirect to last valid page
  if (page > totalPages && result.total > 0) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (sort !== "downloads") params.set("sort", sort);
    if (category) params.set("category", category);
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
        categories={categories}
        keywords={keywords}
        category={category}
      />
    </Layout>
  );
});

// Agent-readable .ctx endpoint: proxy to API (respects package visibility)
app.get("/package/:fullName{@[^/]+/[^/]+\\.ctx}", async (c) => {
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

// Package settings: /@scope/name/settings
app.get("/package/:fullName{@[^/]+/[^/]+}/settings", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const fullName = c.req.param("fullName");
  const parts = fullName.replace(/^@/, "").split("/");
  const scope = parts[0];
  const name = parts[1];
  const error = c.req.query("error") ?? undefined;
  const success = c.req.query("success") ?? undefined;

  let visibility = "public";
  let deprecated = false;
  let deprecationMessage: string | undefined;
  let canManage = false;
  let trustedPublishers: import("./lib/types").TrustedPublisher[] = [];
  let distTags: Record<string, string> = {};
  let accessList: import("./lib/types").PackageAccessEntry[] = [];

  try {
    const pkg = await api(c).getPackage(fullName, token);
    visibility = pkg.visibility ?? "public";
    deprecated = pkg.deprecated ?? false;
    deprecationMessage = pkg.deprecation_message;
    canManage = true;

    // Load additional data in parallel (best-effort)
    const [tpResult, tagsResult] = await Promise.all([
      api(c).listTrustedPublishers(fullName, token).catch(() => ({ trusted_publishers: [] as import("./lib/types").TrustedPublisher[] })),
      api(c).getPackageTags(fullName).catch(() => ({ tags: {} as Record<string, string> })),
    ]);
    trustedPublishers = tpResult.trusted_publishers ?? [];
    distTags = tagsResult.tags ?? {};

    // Load ACL for private packages
    if (visibility === "private") {
      try {
        const aclResult = await api(c).getPackageAccess(fullName, token);
        accessList = aclResult.access ?? [];
      } catch {
        // Token may lack manage-access scope
      }
    }
  } catch {
    // Package not found or no access
  }

  const meta = { ...defaultMeta(), title: `${fullName} Settings — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath={`/package/${fullName}/settings`} user={user}>
      <PackageSettingsPage
        fullName={fullName}
        scope={scope}
        name={name}
        visibility={visibility}
        deprecated={deprecated}
        deprecationMessage={deprecationMessage}
        distTags={distTags}
        accessList={accessList}
        canManage={canManage}
        trustedPublishers={trustedPublishers}
        error={error}
        success={success}
      />
    </Layout>
  );
});

// Package settings POST actions
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/visibility", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  try {
    await api(c).setVisibility(fullName, body.visibility as string, token);
  } catch {
    return c.redirect(`/package/${fullName}/settings?error=Failed+to+update+visibility`);
  }
  return c.redirect(`/package/${fullName}/settings`);
});

app.post("/package/:fullName{@[^/]+/[^/]+}/settings/rename", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  try {
    const result = await api(c).renamePackage(fullName, body.new_name as string, fullName, token);
    const newName = result.new_name ?? fullName;
    return c.redirect(`/package/${newName}/settings`);
  } catch {
    return c.redirect(`/package/${fullName}/settings?error=Failed+to+rename+package`);
  }
});

app.post("/package/:fullName{@[^/]+/[^/]+}/settings/transfer", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  try {
    await api(c).initiateTransfer(fullName, body.to as string, "", token);
    return c.redirect(`/package/${fullName}/settings?error=Transfer+request+sent`);
  } catch {
    return c.redirect(`/package/${fullName}/settings?error=Failed+to+initiate+transfer`);
  }
});

// Trusted publishers: add
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/trusted-publishers", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();

  // Server-side validation
  const githubRepo = (body.github_repo as string)?.trim() ?? "";
  const workflow = (body.workflow as string)?.trim() ?? "";
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(githubRepo)) {
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent("Invalid repository format. Use owner/repo.")}`);
  }
  if (!/^[a-zA-Z0-9._-]+\.ya?ml$/.test(workflow)) {
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent("Invalid workflow filename. Use name.yml or name.yaml.")}`);
  }

  try {
    await api(c).addTrustedPublisher(fullName, {
      provider: "github",
      github_repo: githubRepo,
      workflow,
      environment: (body.environment as string)?.trim() || undefined,
    }, token);
  } catch {
    return c.redirect(`/package/${fullName}/settings?error=Failed+to+add+trusted+publisher`);
  }
  return c.redirect(`/package/${fullName}/settings`);
});

// Trusted publishers: delete
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/trusted-publishers/:tpId/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const tpId = c.req.param("tpId");
  try {
    await api(c).deleteTrustedPublisher(fullName, tpId, token);
  } catch {
    return c.redirect(`/package/${fullName}/settings?error=Failed+to+remove+trusted+publisher`);
  }
  return c.redirect(`/package/${fullName}/settings`);
});

// Deprecation toggle
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/deprecate", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  const deprecated = body.deprecated === "true";
  const message = (body.message as string)?.trim() || undefined;
  try {
    await api(c).deprecatePackage(fullName, deprecated, message, token);
    return c.redirect(`/package/${fullName}/settings?success=${encodeURIComponent(deprecated ? "Package deprecated" : "Deprecation removed")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update deprecation";
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Package deletion
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");

  const body = await c.req.parseBody();
  const confirm = (body.confirm as string)?.trim();
  if (!confirm || confirm !== fullName) {
    return c.redirect(`/package/${fullName}/settings?error=Confirmation+does+not+match+package+name`);
  }

  try {
    await api(c).deletePackage(fullName, token);
    return c.redirect("/dashboard?tab=packages");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete package";
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Dist-tag management
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/dist-tag", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  const tag = (body.tag as string)?.trim();
  const version = (body.version as string)?.trim();
  if (!tag || !version) {
    return c.redirect(`/package/${fullName}/settings?error=Tag+and+version+are+required`);
  }
  try {
    await api(c).setDistTag(fullName, tag, version, token);
    return c.redirect(`/package/${fullName}/settings?success=${encodeURIComponent("Tag set")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to set tag";
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent(msg)}`);
  }
});

app.post("/package/:fullName{@[^/]+/[^/]+}/settings/dist-tag/:tag/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const tag = c.req.param("tag");
  try {
    await api(c).deleteDistTag(fullName, tag, token);
    return c.redirect(`/package/${fullName}/settings?success=${encodeURIComponent("Tag deleted")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete tag";
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Package access control
app.post("/package/:fullName{@[^/]+/[^/]+}/settings/access", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  const action = body.action as string;
  const username = (body.username as string)?.trim();
  if (!username) {
    return c.redirect(`/package/${fullName}/settings?error=Username+is+required`);
  }
  try {
    if (action === "add") {
      await api(c).updatePackageAccess(fullName, [username], [], token);
    } else {
      await api(c).updatePackageAccess(fullName, [], [username], token);
    }
    return c.redirect(`/package/${fullName}/settings?success=${encodeURIComponent("Access updated")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update access";
    return c.redirect(`/package/${fullName}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Package stats: /@scope/name/stats
app.get("/package/:fullName{@[^/]+/[^/]+}/stats", async (c) => {
  const fullName = c.req.param("fullName");
  try {
    const stats = await api(c).getPackageStats(fullName, c.get("token"));
    const meta = { ...defaultMeta(), title: `${fullName} Stats — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/package/${fullName}/stats`} user={c.get("user")}>
        <PackageStatsPage fullName={fullName} stats={stats} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">Package not found</h1>
            <p class="text-sm text-muted-foreground">{fullName} does not exist.</p>
          </Container>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Package detail: /@scope/name
app.get("/package/:fullName{@[^/]+/[^/]+}", async (c) => {
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
      <Layout meta={meta} currentPath={`/package/${fullName}`} user={c.get("user")}>
        <PackageDetailPage pkg={pkg} readmeHtml={readmeHtml} manifest={manifestInfo} mcpDetail={(pkg as any).mcp_detail ?? null} isLoggedIn={!!c.get("user")} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">Package not found</h1>
            <p class="text-sm text-muted-foreground">{fullName} does not exist.</p>
          </Container>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Star / Unstar package (POST forms from package detail page)
app.post("/package/:fullName{@[^/]+/[^/]+}/star", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  try {
    await api(c).starPackage(fullName, token);
  } catch (err) {
    console.error("Star failed:", err instanceof Error ? err.message : err);
  }
  return c.redirect(`/package/${fullName}`);
});

app.post("/package/:fullName{@[^/]+/[^/]+}/unstar", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  try {
    await api(c).unstarPackage(fullName, token);
  } catch (err) {
    console.error("Unstar failed:", err instanceof Error ? err.message : err);
  }
  return c.redirect(`/package/${fullName}`);
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
// --- Settings Hub ---

app.get("/settings/tokens", (c) => {
  const qs = c.req.query("error") || c.req.query("success") ? `&${new URL(c.req.url).searchParams}` : "";
  return c.redirect(`/settings?tab=tokens${qs}`);
});

app.get("/settings", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  const settingsPath = new URL(c.req.url).pathname + new URL(c.req.url).search;
  if (!user || !token) return c.redirect(`/login?redirect=${encodeURIComponent(settingsPath)}`);

  const tab = (c.req.query("tab") || "profile") as SettingsTab;
  const validTabs: SettingsTab[] = ["profile", "tokens", "account"];
  const activeTab = validTabs.includes(tab) ? tab : "profile";

  let error = c.req.query("error") || undefined;
  const success = c.req.query("success") || undefined;
  let profile: import("./lib/types").Profile | undefined;
  let tokens: import("./lib/types").TokenInfo[] = [];
  let newToken: string | undefined;

  if (activeTab === "profile") {
    try {
      profile = await api(c).getProfile(user.username);
    } catch {
      // Profile may not exist yet — show empty form
    }
  } else if (activeTab === "tokens") {
    try {
      const result = await api(c).listTokens(token);
      tokens = result.tokens;
    } catch (err) {
      error = "Failed to load tokens";
      console.error("Token list error:", err);
    }
    // Read newly created token from ephemeral cookie
    newToken = getCookie(c, "__Host-new_token") as string | undefined;
    if (newToken) {
      deleteCookie(c, "__Host-new_token", { path: "/", secure: true, httpOnly: true, sameSite: "Strict" });
    }
  }

  const meta = { ...defaultMeta(), title: `Settings — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/settings" user={user}>
      <SettingsPage
        user={user}
        tab={activeTab}
        profile={profile}
        tokens={tokens}
        newToken={newToken}
        error={error}
        success={success}
      />
    </Layout>
  );
});

app.post("/settings/profile/update", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const body = await c.req.parseBody();
  const bio = (body.bio as string)?.trim() ?? "";
  const website = (body.website as string)?.trim() ?? "";

  try {
    await api(c).updateProfile({ bio, website }, token);
    return c.redirect(`/settings?tab=profile&success=${encodeURIComponent("Profile updated")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return c.redirect(`/settings?tab=profile&error=${encodeURIComponent(message)}`);
  }
});

app.post("/settings/account/rename", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const body = await c.req.parseBody();
  const newUsername = (body.new_username as string)?.trim();
  const confirm = (body.confirm as string)?.trim();

  if (!newUsername || !confirm) {
    return c.redirect("/settings?tab=account&error=All+fields+are+required");
  }

  try {
    await api(c).renameUser(newUsername, confirm, token);
    return c.redirect(`/settings?tab=account&success=${encodeURIComponent("Username updated successfully")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to rename account";
    return c.redirect(`/settings?tab=account&error=${encodeURIComponent(message)}`);
  }
});

app.post("/settings/account/delete", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const deleteBody = await c.req.parseBody();
  const deleteConfirm = (deleteBody.confirm as string)?.trim();
  if (!deleteConfirm || deleteConfirm !== user.username) {
    return c.redirect("/settings?tab=account&error=Confirmation+does+not+match+your+username");
  }

  try {
    await api(c).deleteAccount(token);
    // Clear session and redirect to home
    deleteCookie(c, "__Host-ctx_session", { path: "/", secure: true, httpOnly: true, sameSite: "Strict" });
    return c.redirect("/");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return c.redirect(`/settings?tab=account&error=${encodeURIComponent(message)}`);
  }
});

app.post("/settings/tokens/create", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const body = await c.req.parseBody();
  const name = (body.name as string)?.trim();
  if (!name) return c.redirect("/settings?tab=tokens&error=Token+name+is+required");

  const expiresInDays = body.expires_in_days ? parseInt(body.expires_in_days as string) : undefined;

  // Collect endpoint scopes from checkboxes
  const rawScopes = body.endpoint_scopes;
  const endpointScopes = rawScopes
    ? (Array.isArray(rawScopes) ? rawScopes as string[] : [rawScopes as string])
    : undefined;

  // Parse package scopes from comma-separated input
  const packageScopesRaw = (body.package_scopes as string)?.trim();
  const packageScopes = packageScopesRaw
    ? packageScopesRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
    : undefined;

  const tokenType = (body.token_type as string) || undefined;

  try {
    const result = await api(c).createToken({
      name,
      expires_in_days: expiresInDays,
      endpoint_scopes: endpointScopes,
      package_scopes: packageScopes,
      token_type: tokenType,
    }, token);

    // Pass token via ephemeral cookie to avoid exposing it in URL/history/logs
    setCookie(c, "__Host-new_token", result.token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/",
      maxAge: 60,
    });
    return c.redirect("/settings?tab=tokens");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create token";
    return c.redirect(`/settings?tab=tokens&error=${encodeURIComponent(message)}`);
  }
});

app.post("/settings/tokens/:id/revoke", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const tokenId = c.req.param("id");
  try {
    await api(c).revokeToken(tokenId, token);
    return c.redirect(`/settings?tab=tokens&success=${encodeURIComponent("Token revoked")}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to revoke token";
    return c.redirect(`/settings?tab=tokens&error=${encodeURIComponent(message)}`);
  }
});

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
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return c.redirect("/login");
    }

    let errorMsg = "Failed to create organization. Please try again.";
    let statusCode: 409 | 422 | 500 = 422;
    if (err instanceof ApiError) {
      const apiMsg = err.body?.message;
      errorMsg = (typeof apiMsg === "string" && apiMsg) || err.message || errorMsg;
      if (err.status === 409) statusCode = 409;
      else if (err.status >= 500) statusCode = 500;
    }

    const meta = { ...defaultMeta(), title: `Create Organization — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath="/orgs/new" user={user}>
        <CreateOrgPage
          error={errorMsg}
          values={{ name, display_name: displayName }}
        />
      </Layout>,
      statusCode,
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
  const activeTab = rawTab && ["packages", "stars", "orgs", "notifications", "claims", "sync"].includes(rawTab) ? rawTab : "packages";

  // Fetch the user's published packages via profile API
  let packages: PackageSummary[] = [];
  try {
    const pkgResult = await api(c).getProfilePackages(user.username, { limit: 50 }, token);
    packages = pkgResult.packages;
  } catch {
    // Non-critical — show dashboard with empty list
  }

  // Fetch orgs and invitations if on orgs tab
  let orgs: OrgInfo[] = [];
  let invitations: OrgInvitation[] = [];
  if (activeTab === "orgs") {
    try {
      const [orgResult, invResult] = await Promise.all([
        api(c).getMyOrgs(token),
        api(c).listMyInvitations(token),
      ]);
      orgs = orgResult.orgs;
      invitations = invResult.invitations;
    } catch {
      // Non-critical
    }
  }

  // Fetch notifications and transfers
  let notifications: any[] = [];
  let transfers: any[] = [];
  let notificationCount = 0;
  if (activeTab === "notifications") {
    try {
      const [notifResult, xferResult] = await Promise.all([
        api(c).listNotifications(token),
        api(c).listMyTransfers(token),
      ]);
      notifications = notifResult.notifications ?? notifResult;
      transfers = xferResult.transfers ?? xferResult;
    } catch {
      // Non-critical
    }
  }
  // Always fetch count for badge
  try {
    const countResult = await api(c).getNotificationCount(token);
    notificationCount = countResult.unread ?? countResult ?? 0;
  } catch {
    // Non-critical
  }

  // Fetch starred packages and star lists if on stars tab
  let stars: StarredPackage[] = [];
  let starLists: import("./lib/types").StarList[] = [];
  const activeListId = c.req.query("list") || undefined;
  if (activeTab === "stars") {
    try {
      const [starResult, listResult] = await Promise.all([
        api(c).listMyStars(token, activeListId),
        api(c).listStarLists(token),
      ]);
      stars = starResult.stars ?? [];
      starLists = listResult.lists ?? [];
    } catch {
      // Non-critical
    }
  }

  // Fetch claimable packages and claims if on claims tab
  let claimablePackages: import("./lib/types").ClaimablePackage[] = [];
  let claimsList: import("./lib/types").Claim[] = [];
  if (activeTab === "claims") {
    try {
      const [claimableResult, claimsResult] = await Promise.all([
        api(c).listClaimable(token),
        api(c).listClaims(token),
      ]);
      claimablePackages = claimableResult.packages ?? [];
      claimsList = claimsResult.claims ?? [];
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
    <Layout meta={meta} currentPath="/dashboard" user={user} notificationCount={notificationCount}>
      <DashboardPage
        username={user.username}
        packages={packages}
        stars={stars}
        starLists={starLists}
        orgs={orgs}
        invitations={invitations}
        transfers={transfers}
        notifications={notifications}
        notificationCount={notificationCount}
        claimablePackages={claimablePackages}
        claims={claimsList}
        syncMeta={syncMeta}
        activeTab={activeTab}
        activeListId={activeListId}
      />
    </Layout>
  );
});

// Profile page — vanity URL: /@slug
// Uses regex constraint to match paths starting with @ (e.g., /@biao29)
app.get("/:slug{@[^/]+}", async (c) => {
  const slug = c.req.param("slug")!.replace(/^@/, "");
  try {
    const [profile, pkgResult] = await Promise.all([
      api(c).getProfile(slug),
      api(c).getProfilePackages(slug, { limit: 50 }, c.get("token")),
    ]);
    const meta = { ...defaultMeta(), title: `@${slug} — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/@${slug}`} user={c.get("user")}>
        <ProfilePage profile={profile} packages={pkgResult.packages} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">User not found</h1>
            <p class="text-sm text-muted-foreground">@{slug} does not exist.</p>
          </Container>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// Org Settings (auth required, owner/admin only)
app.get("/org/:name/settings", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    // Step 1: Check membership first (no admin-only APIs yet)
    const [org, membersResult] = await Promise.all([
      api(c).getOrg(name),
      api(c).getOrgMembers(name, token),
    ]);

    const currentMember = membersResult.members.find((m: OrgMember) => m.username === user.username);
    if (!currentMember || !["owner", "admin"].includes(currentMember.role)) {
      return c.redirect(`/org/${name}`);
    }

    // Step 2: Now safe to fetch admin-only data
    let invitations: OrgInvitation[] = [];
    try {
      const invResult = await api(c).listOrgInvitations(name, token);
      invitations = invResult.invitations;
    } catch {
      // Non-critical — show settings without invitations
    }

    const meta = { ...defaultMeta(), title: `Settings — ${org.display_name || org.name} — ${SITE_NAME}` };
    return c.html(
      <Layout meta={meta} currentPath={`/org/${name}/settings`} user={user}>
        <OrgSettingsPage
          org={org}
          members={membersResult.members}
          invitations={invitations}
          currentUser={user.username}
          userRole={currentMember.role}
          success={c.req.query("success") || undefined}
          error={c.req.query("error") || undefined}
        />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      return c.redirect(`/org/${name}`);
    }
    throw err;
  }
});

// Org invite form action
app.post("/org/:name/invite", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const name = c.req.param("name");
  const body = await c.req.parseBody();
  const username = String(body.username ?? "").trim();
  const role = String(body.role ?? "member").trim();

  try {
    await api(c).inviteOrgMember(name, username, role, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent(`Invited ${username}`)}`);
  } catch (err) {
    if (err instanceof ApiError) {
      // Reload settings page with error — fetch members first, invitations separately
      try {
        const [org, membersResult] = await Promise.all([
          api(c).getOrg(name),
          api(c).getOrgMembers(name, token),
        ]);
        const currentMember = membersResult.members.find((m: OrgMember) => m.username === user.username);
        let invitations: OrgInvitation[] = [];
        try {
          const invResult = await api(c).listOrgInvitations(name, token);
          invitations = invResult.invitations;
        } catch { /* non-critical */ }
        const meta = { ...defaultMeta(), title: `Settings — ${org.display_name || org.name} — ${SITE_NAME}` };
        const apiMsg = err.body?.message;
        return c.html(
          <Layout meta={meta} currentPath={`/org/${name}/settings`} user={user}>
            <OrgSettingsPage
              org={org}
              members={membersResult.members}
              invitations={invitations}
              currentUser={user.username}
              userRole={currentMember?.role ?? "member"}
              error={typeof apiMsg === "string" ? apiMsg : err.message}
            />
          </Layout>,
          err.status >= 500 ? 500 : 422,
        );
      } catch {
        return c.redirect(`/org/${name}/settings`);
      }
    }
    throw err;
  }
});

// Cancel invitation form action
app.post("/org/:name/invitations/:id/cancel", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  const invId = c.req.param("id");
  try {
    await api(c).cancelOrgInvitation(name, invId, token);
  } catch {
    // Best-effort, redirect anyway
  }
  return c.redirect(`/org/${name}/settings`);
});

// Toggle member visibility form action
app.post("/org/:name/members/:username/visibility", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const name = c.req.param("name");
  const username = c.req.param("username");

  // Only allow self
  if (username !== user.username) return c.redirect(`/org/${name}/settings`);

  const body = await c.req.parseBody();
  const visibility = String(body.visibility ?? "private");

  try {
    await api(c).updateMemberVisibility(name, user.username, visibility, token);
  } catch {
    // Best-effort
  }
  return c.redirect(`/org/${name}/settings`);
});

// Remove member form action
app.post("/org/:name/members/:username/remove", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  const username = c.req.param("username");

  try {
    await api(c).removeMember(name, username!, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent(`Removed ${username}`)}`);
  } catch {
    return c.redirect(`/org/${name}/settings`);
  }
});

// Archive org form action
app.post("/org/:name/settings/archive", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    await api(c).archiveOrg(name, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent("Organization archived")}`);
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to archive organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Unarchive org form action
app.post("/org/:name/settings/unarchive", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    await api(c).unarchiveOrg(name, token);
    return c.redirect(`/org/${name}/settings?success=${encodeURIComponent("Organization unarchived")}`);
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to unarchive organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Leave org form action
app.post("/org/:name/settings/leave", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  try {
    await api(c).leaveOrg(name, token);
    return c.redirect("/dashboard?tab=orgs");
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to leave organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Delete org form action
app.post("/org/:name/settings/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");

  const name = c.req.param("name");
  const body = await c.req.parseBody();
  const confirm = String(body.confirm ?? "").trim();

  if (confirm !== name) {
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent("Confirmation does not match organization name")}`);
  }

  try {
    await api(c).dissolveOrg(name, "delete", confirm, "", token);
    return c.redirect("/dashboard?tab=orgs");
  } catch (err) {
    const msg = err instanceof ApiError ? ((err.body?.message as string) || err.message) : "Failed to delete organization";
    return c.redirect(`/org/${name}/settings?error=${encodeURIComponent(msg)}`);
  }
});

// Accept/decline invitation form actions (from dashboard)
app.post("/invitations/:id/accept", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).acceptInvitation(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=orgs");
});

app.post("/invitations/:id/decline", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).declineInvitation(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=orgs");
});

// Transfer accept/decline form actions (from dashboard notifications tab)
app.post("/transfers/:id/accept", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).acceptTransfer(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

app.post("/transfers/:id/decline", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).declineTransfer(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Mark notification as read (from dashboard)
app.post("/notifications/:id/read", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).markNotificationRead(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Mark all notifications as read
app.post("/notifications/mark-all-read", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  try {
    await api(c).markAllNotificationsRead(token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Dismiss notification
app.post("/notifications/:id/dismiss", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).dismissNotification(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=notifications");
});

// Star lists CRUD
app.post("/stars/lists/create", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const body = await c.req.parseBody();
  const name = (body.name as string)?.trim();
  if (!name) return c.redirect("/dashboard?tab=stars");
  try {
    await api(c).createStarList({ name }, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=stars");
});

app.post("/stars/lists/:id/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const id = c.req.param("id");
  try {
    await api(c).deleteStarList(id, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=stars");
});

// Claims
app.post("/claims", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const body = await c.req.parseBody();
  const packageId = body.package_id as string;
  if (!packageId) return c.redirect("/dashboard?tab=claims");
  try {
    await api(c).claimPackage(packageId, token);
  } catch {
    // Best-effort
  }
  return c.redirect("/dashboard?tab=claims");
});

// Organization page
app.get("/org/:name", async (c) => {
  const name = c.req.param("name");
  try {
    const [org, pkgResult] = await Promise.all([
      api(c).getOrg(name),
      api(c).getOrgPackages(name, c.get("token")),
    ]);

    // Members: auth users see all members, public users see only public members
    let members: OrgMember[] | null = null;
    let userRole: string | null = null;
    const token = c.get("token");
    const user = c.get("user");
    if (token) {
      try {
        const result = await api(c).getOrgMembers(name, token);
        members = result.members;
        if (user) {
          const currentMember = members?.find((m: OrgMember) => m.username === user.username);
          userRole = currentMember?.role ?? null;
        }
      } catch {
        // Not a member — fall through to public members
      }
    }
    if (!members) {
      try {
        const result = await api(c).getPublicMembers(name);
        members = result.members;
      } catch {
        // leave as null
      }
    }

    const meta = { ...defaultMeta(), title: `${org.display_name || org.name} — ${SITE_NAME}` };
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return c.html(
      <Layout meta={meta} currentPath={`/org/${name}`} user={user}>
        <OrgPage org={org} members={members} packages={pkgResult.packages} userRole={userRole} />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">Organization not found</h1>
            <p class="text-sm text-muted-foreground">{name} does not exist.</p>
          </Container>
        </Layout>,
        404
      );
    }
    throw err;
  }
});

// MCP Hub page
app.get("/mcp", async (c) => {
  const api = new ApiClient(c.env.API_BASE_URL);
  const category = c.req.query("category") ?? "";
  const sort = c.req.query("sort") ?? "downloads";
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = 18;
  const offset = (page - 1) * limit;

  let servers: import("./lib/types").MCPHubEntry[] = [];
  let featured: import("./lib/types").MCPHubEntry[] | null = null;
  let categories: import("./lib/types").MCPCategoryCount[] = [];
  let total = 0;

  try {
    const [hubResult, featuredResult] = await Promise.all([
      api.getMCPHub({ category, sort, limit, offset }),
      page === 1 && !category ? api.getMCPFeatured() : Promise.resolve(null),
    ]);
    servers = hubResult.servers;
    total = hubResult.total;
    categories = hubResult.categories;
    if (featuredResult) featured = featuredResult.servers;
  } catch (err) {
    console.error("MCP Hub fetch failed:", err);
  }

  const meta = {
    title: "MCP Hub — Discover MCP Servers | getctx.org",
    description: "Browse and install MCP (Model Context Protocol) servers for AI agents. Categorized directory with one-command installation.",
    url: `${SITE_URL}/mcp`,
    ogImage: DEFAULT_OG_IMAGE,
    type: "website",
  };

  return c.html(
    <Layout meta={meta} currentPath="/mcp" user={c.get("user")}>
      <MCPHubPage
        servers={servers}
        featured={featured}
        categories={categories}
        total={total}
        category={category}
        sort={sort}
        page={page}
        limit={limit}
      />
    </Layout>
  );
});

// Submit page — package request form
app.get("/submit", async (c) => {
  const meta = { ...defaultMeta(), title: `Submit a Package — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/submit" user={c.get("user")}>
      <SubmitPage />
    </Layout>
  );
});

app.post("/submit", async (c) => {
  const meta = { ...defaultMeta(), title: `Submit a Package — ${SITE_NAME}` };
  const user = c.get("user");
  const token = c.get("token");
  const body = await c.req.parseBody();
  const sourceUrl = (body.source_url as string)?.trim();

  if (!sourceUrl) {
    return c.html(
      <Layout meta={meta} currentPath="/submit" user={user}>
        <SubmitPage error="Source URL is required" />
      </Layout>
    );
  }

  try {
    await api(c).submitPackage(
      { source_url: sourceUrl, reason: (body.reason as string)?.trim() ?? "" },
      token,
    );
    return c.html(
      <Layout meta={meta} currentPath="/submit" user={user}>
        <SubmitPage success />
      </Layout>
    );
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : "Failed to submit request";
    return c.html(
      <Layout meta={meta} currentPath="/submit" user={user}>
        <SubmitPage error={msg} />
      </Layout>
    );
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

// Package-specific install script — proxied to API
// Usage: curl -fsSL https://getctx.org/install/@scope/package | sh
app.get("/install/@:scope/:name", async (c) => {
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
      <Container class="py-16 text-center">
        <h1 class="mb-2 text-xl font-semibold font-heading">Something went wrong</h1>
        <p class="text-sm text-muted-foreground">Please try again later.</p>
      </Container>
    </Layout>,
    500
  );
});

export default app;
