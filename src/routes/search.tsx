import { Hono } from "hono";
import { Layout } from "../layout";
import { api } from "../lib/api-helpers";
import type { AppEnv } from "../lib/api-helpers";
import { searchMeta } from "../lib/seo";
import type { PackageType, SortOption, SearchResult, CategoryInfo, KeywordInfo } from "../lib/types";
import { validateSort } from "../lib/search-url";
import { SearchPage } from "../pages/search";

const route = new Hono<AppEnv>();

route.get("/search", async (c) => {
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

export default route;
