import { Hono } from "hono";
import { Layout } from "../layout";
import { Container } from "../components/ui/container";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { ApiError } from "../lib/api-client";
import { defaultMeta, packageMeta, escapeHtml } from "../lib/seo";
import { SITE_NAME } from "../lib/constants";
import { safeMarked } from "../lib/markdown";
import type { ManifestInfo, TrustedPublisher, PackageAccessEntry, VersionSummary } from "../lib/types";
import { parseManifest } from "../lib/types";
import { PackageDetailPage } from "../pages/package-detail";
import { PackageSettingsPage, type PkgSettingsTab } from "../pages/package-settings";
import { PackageStatsPage } from "../pages/package-stats";

const route = new Hono<AppEnv>();

// Agent-readable .ctx endpoint: proxy to API (respects package visibility)
route.get("/package/:fullName{@[^/]+/[^/]+\\.ctx}", async (c) => {
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
route.get("/package/:fullName{@[^/]+/[^/]+}/settings", async (c) => {
  const user = c.get("user");
  const token = c.get("token");
  if (!user || !token) return c.redirect("/login");

  const fullName = c.req.param("fullName");
  const parts = fullName.replace(/^@/, "").split("/");
  const scope = parts[0];
  const name = parts[1];
  const error = c.req.query("error") ?? undefined;
  const success = c.req.query("success") ?? undefined;
  const validTabs: PkgSettingsTab[] = ["general", "versions", "access", "publish", "danger"];
  const tab = (validTabs.includes(c.req.query("tab") as PkgSettingsTab) ? c.req.query("tab") : "general") as PkgSettingsTab;

  let visibility = "public";
  let deprecated = false;
  let deprecationMessage: string | undefined;
  let canManage = false;
  let trustedPublishers: TrustedPublisher[] = [];
  let distTags: Record<string, string> = {};
  let accessList: PackageAccessEntry[] = [];
  let description: string | undefined;
  let keywords: string[] | undefined;
  let homepage: string | undefined;
  let repository: string | undefined;
  let license: string | undefined;
  let author: string | undefined;
  let versions: VersionSummary[] = [];

  try {
    const pkg = await api(c).getPackage(fullName, token);
    visibility = pkg.visibility ?? "public";
    deprecated = pkg.deprecated ?? false;
    deprecationMessage = pkg.deprecation_message;
    canManage = true;
    description = pkg.description;
    keywords = pkg.keywords;
    homepage = pkg.homepage;
    repository = pkg.repository;
    license = pkg.license;
    author = pkg.author;
    versions = pkg.versions ?? [];

    // Load additional data in parallel (best-effort)
    const [tpResult, tagsResult] = await Promise.all([
      api(c).listTrustedPublishers(fullName, token).catch(() => ({ trusted_publishers: [] as TrustedPublisher[] })),
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
        tab={tab}
        visibility={visibility}
        description={description}
        keywords={keywords}
        homepage={homepage}
        repository={repository}
        license={license}
        author={author}
        deprecated={deprecated}
        deprecationMessage={deprecationMessage}
        distTags={distTags}
        versions={versions}
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
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/visibility", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  try {
    await api(c).setVisibility(fullName, body.visibility as string, token);
  } catch {
    return c.redirect(`/package/${fullName}/settings?tab=general&error=Failed+to+update+visibility`);
  }
  return c.redirect(`/package/${fullName}/settings?tab=general`);
});

route.post("/package/:fullName{@[^/]+/[^/]+}/settings/rename", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  try {
    const confirm = (body.confirm as string)?.trim();
    if (confirm !== fullName) {
      return c.redirect(`/package/${fullName}/settings?tab=danger&error=${encodeURIComponent("Confirmation does not match package name")}`);
    }
    const result = await api(c).renamePackage(fullName, body.new_name as string, confirm, token);
    const newName = result.new_name ?? fullName;
    return c.redirect(`/package/${newName}/settings?tab=danger&success=Package+renamed`);
  } catch {
    return c.redirect(`/package/${fullName}/settings?tab=danger&error=Failed+to+rename+package`);
  }
});

route.post("/package/:fullName{@[^/]+/[^/]+}/settings/transfer", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  try {
    const confirm = (body.confirm as string)?.trim();
    if (confirm !== fullName) {
      return c.redirect(`/package/${fullName}/settings?tab=danger&error=${encodeURIComponent("Confirmation does not match package name")}`);
    }
    await api(c).initiateTransfer(fullName, body.to as string, (body.message as string) ?? "", token);
    return c.redirect(`/package/${fullName}/settings?tab=danger&success=Transfer+request+sent`);
  } catch {
    return c.redirect(`/package/${fullName}/settings?tab=danger&error=Failed+to+initiate+transfer`);
  }
});

// Trusted publishers: add
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/trusted-publishers", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();

  // Server-side validation
  const githubRepo = (body.github_repo as string)?.trim() ?? "";
  const workflow = (body.workflow as string)?.trim() ?? "";
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(githubRepo)) {
    return c.redirect(`/package/${fullName}/settings?tab=publish&error=${encodeURIComponent("Invalid repository format. Use owner/repo.")}`);
  }
  if (!/^[a-zA-Z0-9._-]+\.ya?ml$/.test(workflow)) {
    return c.redirect(`/package/${fullName}/settings?tab=publish&error=${encodeURIComponent("Invalid workflow filename. Use name.yml or name.yaml.")}`);
  }

  try {
    await api(c).addTrustedPublisher(fullName, {
      provider: "github",
      github_repo: githubRepo,
      workflow,
      environment: (body.environment as string)?.trim() || undefined,
    }, token);
  } catch {
    return c.redirect(`/package/${fullName}/settings?tab=publish&error=Failed+to+add+trusted+publisher`);
  }
  return c.redirect(`/package/${fullName}/settings?tab=publish`);
});

// Trusted publishers: delete
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/trusted-publishers/:tpId/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const tpId = c.req.param("tpId");
  try {
    await api(c).deleteTrustedPublisher(fullName, tpId, token);
  } catch {
    return c.redirect(`/package/${fullName}/settings?tab=publish&error=Failed+to+remove+trusted+publisher`);
  }
  return c.redirect(`/package/${fullName}/settings?tab=publish`);
});

// Deprecation toggle
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/deprecate", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  const deprecated = body.deprecated === "true";
  const message = (body.message as string)?.trim() || undefined;
  try {
    await api(c).deprecatePackage(fullName, deprecated, message, token);
    return c.redirect(`/package/${fullName}/settings?tab=general&success=${encodeURIComponent(deprecated ? "Package deprecated" : "Deprecation removed")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update deprecation";
    return c.redirect(`/package/${fullName}/settings?tab=general&error=${encodeURIComponent(msg)}`);
  }
});

// Package deletion
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");

  const body = await c.req.parseBody();
  const confirm = (body.confirm as string)?.trim();
  if (!confirm || confirm !== fullName) {
    return c.redirect(`/package/${fullName}/settings?tab=danger&error=Confirmation+does+not+match+package+name`);
  }

  try {
    await api(c).deletePackage(fullName, token);
    return c.redirect("/dashboard?tab=packages");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete package";
    return c.redirect(`/package/${fullName}/settings?tab=danger&error=${encodeURIComponent(msg)}`);
  }
});

// Dist-tag management
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/dist-tag", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  const tag = (body.tag as string)?.trim();
  const version = (body.version as string)?.trim();
  if (!tag || !version) {
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=Tag+and+version+are+required`);
  }
  try {
    await api(c).setDistTag(fullName, tag, version, token);
    return c.redirect(`/package/${fullName}/settings?tab=versions&success=${encodeURIComponent("Tag set")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to set tag";
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=${encodeURIComponent(msg)}`);
  }
});

route.post("/package/:fullName{@[^/]+/[^/]+}/settings/dist-tag/:tag/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const tag = c.req.param("tag");
  try {
    await api(c).deleteDistTag(fullName, tag, token);
    return c.redirect(`/package/${fullName}/settings?tab=versions&success=${encodeURIComponent("Tag deleted")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete tag";
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=${encodeURIComponent(msg)}`);
  }
});

// Package access control
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/access", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();
  const action = body.action as string;
  const username = (body.username as string)?.trim();
  if (!username) {
    return c.redirect(`/package/${fullName}/settings?tab=access&error=Username+is+required`);
  }
  try {
    if (action === "add") {
      await api(c).updatePackageAccess(fullName, [username], [], token);
    } else {
      await api(c).updatePackageAccess(fullName, [], [username], token);
    }
    return c.redirect(`/package/${fullName}/settings?tab=access&success=${encodeURIComponent("Access updated")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update access";
    return c.redirect(`/package/${fullName}/settings?tab=access&error=${encodeURIComponent(msg)}`);
  }
});

// Package metadata update
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/metadata", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const body = await c.req.parseBody();

  const metadata: Record<string, unknown> = {};
  if (body.description !== undefined) metadata.description = (body.description as string).trim();
  if (body.homepage !== undefined) metadata.homepage = (body.homepage as string).trim();
  if (body.repository !== undefined) metadata.repository = (body.repository as string).trim();
  if (body.license !== undefined) metadata.license = (body.license as string).trim();
  if (body.author !== undefined) metadata.author = (body.author as string).trim();
  if (body.keywords !== undefined) {
    const raw = (body.keywords as string).trim();
    metadata.keywords = raw ? raw.split(",").map((k: string) => k.trim()).filter(Boolean) : [];
  }

  try {
    await api(c).updateMetadata(fullName, metadata as any, token);
    return c.redirect(`/package/${fullName}/settings?tab=general&success=${encodeURIComponent("Metadata updated")}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update metadata";
    return c.redirect(`/package/${fullName}/settings?tab=general&error=${encodeURIComponent(msg)}`);
  }
});

// Version yank
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/versions/:version/yank", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const version = c.req.param("version");
  try {
    await api(c).yankVersion(fullName, version, token);
    return c.redirect(`/package/${fullName}/settings?tab=versions&success=${encodeURIComponent(`Version ${version} yanked`)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to yank version";
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=${encodeURIComponent(msg)}`);
  }
});

// Version unyank
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/versions/:version/unyank", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const version = c.req.param("version");
  try {
    await api(c).unyankVersion(fullName, version, token);
    return c.redirect(`/package/${fullName}/settings?tab=versions&success=${encodeURIComponent(`Version ${version} restored`)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to unyank version";
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=${encodeURIComponent(msg)}`);
  }
});

// Version delete
route.post("/package/:fullName{@[^/]+/[^/]+}/settings/versions/:version/delete", async (c) => {
  const token = c.get("token");
  if (!token) return c.redirect("/login");
  const fullName = c.req.param("fullName");
  const version = c.req.param("version");
  const body = await c.req.parseBody();
  const confirm = (body.confirm as string)?.trim();
  if (confirm !== `${fullName}@${version}`) {
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=${encodeURIComponent("Confirmation does not match")}`);
  }
  try {
    await api(c).deleteVersion(fullName, version, token);
    return c.redirect(`/package/${fullName}/settings?tab=versions&success=${encodeURIComponent(`Version ${version} deleted`)}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete version";
    return c.redirect(`/package/${fullName}/settings?tab=versions&error=${encodeURIComponent(msg)}`);
  }
});

// Package stats: /@scope/name/stats
route.get("/package/:fullName{@[^/]+/[^/]+}/stats", async (c) => {
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
route.get("/package/:fullName{@[^/]+/[^/]+}", async (c) => {
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
        <PackageDetailPage pkg={pkg} readmeHtml={readmeHtml} manifest={manifestInfo} mcpDetail={(pkg as any).mcp_detail ?? null} isLoggedIn={!!c.get("user")} canManage={!!c.get("user") && !!pkg.owner && (pkg.owner.slug === (c.get("user") as any)?.username || pkg.owner.kind === "org")} />
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
route.post("/package/:fullName{@[^/]+/[^/]+}/star", async (c) => {
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

route.post("/package/:fullName{@[^/]+/[^/]+}/unstar", async (c) => {
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

export default route;
