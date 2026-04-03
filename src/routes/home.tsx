import { Hono } from "hono";
import { Layout } from "../layout";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { defaultMeta } from "../lib/seo";
import type { PackageSummary } from "../lib/types";
import { HomePage } from "../pages/home";

const route = new Hono<AppEnv>();

route.get("/", async (c) => {
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

export default route;
