import { Hono } from "hono";
import { Layout } from "../layout";
import type { AppEnv } from "../lib/api-helpers";
import { docsMeta } from "../lib/seo";
import { DocsPage, VALID_DOC_SECTIONS } from "../pages/docs";

const route = new Hono<AppEnv>();

route.get("/docs", (c) => {
  const meta = docsMeta();
  c.header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");
  return c.html(
    <Layout meta={meta} currentPath="/docs" user={c.get("user")}>
      <DocsPage />
    </Layout>
  );
});

route.get("/docs/:section", (c) => {
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

export default route;
