import { Hono } from "hono";
import { Layout } from "../layout";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { ApiError } from "../lib/api-client";
import { defaultMeta } from "../lib/seo";
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from "../lib/constants";
import type { PackageSummary, AgentRanking, RegistryOverview } from "../lib/types";
import { StatsPage } from "../pages/stats";
import { PrivacyPage } from "../pages/privacy";
import { MCPHubPage } from "../pages/mcp-hub";
import { SubmitPage } from "../pages/submit";

const route = new Hono<AppEnv>();

// MCP Hub page
route.get("/mcp", async (c) => {
  const apiClient = api(c);
  const category = c.req.query("category") ?? "";
  const sort = c.req.query("sort") ?? "downloads";
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = 18;
  const offset = (page - 1) * limit;

  let servers: import("../lib/types").MCPHubEntry[] = [];
  let featured: import("../lib/types").MCPHubEntry[] | null = null;
  let categories: import("../lib/types").MCPCategoryCount[] = [];
  let total = 0;

  try {
    const [hubResult, featuredResult] = await Promise.all([
      apiClient.getMCPHub({ category, sort, limit, offset }),
      page === 1 && !category ? apiClient.getMCPFeatured() : Promise.resolve(null),
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
route.get("/submit", async (c) => {
  const meta = { ...defaultMeta(), title: `Submit a Package — ${SITE_NAME}` };
  return c.html(
    <Layout meta={meta} currentPath="/submit" user={c.get("user")}>
      <SubmitPage />
    </Layout>
  );
});

route.post("/submit", async (c) => {
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
route.get("/stats", async (c) => {
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
route.get("/privacy", (c) => {
  const meta = { ...defaultMeta(), title: `Privacy Policy — ${SITE_NAME}` };
  c.header("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400");
  return c.html(
    <Layout meta={meta} currentPath="/privacy" user={c.get("user")}>
      <PrivacyPage />
    </Layout>
  );
});

export default route;
