import { Hono } from "hono";
import { Layout } from "../layout";
import { Container } from "../components/ui/container";
import { api, type AppEnv } from "../lib/api-helpers";
import { ApiError } from "../lib/api-client";
import { keywordsMeta, keywordDetailMeta, defaultMeta } from "../lib/seo";
import { SITE_NAME } from "../lib/constants";
import { KeywordsPage } from "../pages/keywords";
import { KeywordDetailPage } from "../pages/keyword-detail";

const route = new Hono<AppEnv>();

// Browse all keywords
route.get("/keywords", async (c) => {
  let keywords: { slug: string; usage_count: number }[] = [];
  let apiError = false;
  try {
    const data = await api(c).getKeywords(200);
    keywords = data.keywords ?? [];
  } catch (e) {
    apiError = true;
    console.error("Keywords: failed to fetch", e);
  }

  const meta = keywordsMeta();
  if (!apiError) {
    c.header("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  }
  return c.html(
    <Layout meta={meta} currentPath="/keywords" user={c.get("user")}>
      <KeywordsPage keywords={keywords} apiError={apiError} />
    </Layout>
  );
});

// Keyword detail — packages tagged with a specific keyword
route.get("/keywords/:slug", async (c) => {
  const slug = c.req.param("slug")!;
  const PAGE_SIZE = 20;
  const rawPage = parseInt(c.req.query("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
  const offset = (page - 1) * PAGE_SIZE;

  try {
    const data = await api(c).getKeyword(slug, { limit: PAGE_SIZE, offset });
    const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

    // Clamp page
    if (page > totalPages && data.total > 0) {
      const qs = totalPages > 1 ? `?page=${totalPages}` : "";
      return c.redirect(`/keywords/${encodeURIComponent(slug)}${qs}`);
    }

    const meta = keywordDetailMeta(slug, data.total);
    c.header("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    return c.html(
      <Layout meta={meta} currentPath="/keywords" user={c.get("user")}>
        <KeywordDetailPage
          keyword={data.keyword}
          packages={data.packages}
          total={data.total}
          page={page}
          totalPages={totalPages}
        />
      </Layout>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return c.html(
        <Layout meta={{ ...defaultMeta(), title: `Not Found — ${SITE_NAME}` }} user={c.get("user")}>
          <Container class="py-16 text-center">
            <h1 class="mb-2 text-xl font-semibold font-heading">Keyword not found</h1>
            <p class="text-sm text-muted-foreground">
              No keyword &ldquo;{slug}&rdquo; exists.{" "}
              <a href="/keywords" class="underline hover:text-foreground">Browse all keywords</a>.
            </p>
          </Container>
        </Layout>,
        404,
      );
    }
    throw err;
  }
});

export default route;
