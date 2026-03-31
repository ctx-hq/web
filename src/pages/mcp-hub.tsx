import type { FC } from "hono/jsx";
import type { MCPHubEntry, MCPCategoryCount } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { MCPCard } from "../components/mcp-card";
import { MCPCategoryNav } from "../components/mcp-category-nav";
import { MCP_SORT_OPTIONS } from "../lib/constants";

export const MCPHubPage: FC<{
  servers: MCPHubEntry[];
  featured: MCPHubEntry[] | null;
  categories: MCPCategoryCount[];
  total: number;
  category: string;
  sort: string;
  page: number;
  limit: number;
}> = ({ servers, featured, categories, total, category, sort, page, limit }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Total across all categories for the "All" count
  const allTotal = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <Container>
      {/* Hero */}
      <section class="pb-8 pt-12 text-center">
        <h1 class="mb-2 text-3xl font-bold font-heading">MCP Hub</h1>
        <p class="mx-auto max-w-lg text-muted-foreground">
          Discover and install MCP servers for your AI agents
        </p>
        <div class="mx-auto mt-4 max-w-md">
          <form action="/search" method="get">
            <input type="hidden" name="type" value="mcp" />
            <div class="relative">
              <Icon name="magnifying-glass" class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                name="q"
                placeholder="Search MCP servers..."
                class="cn-input w-full pl-9"
                aria-label="Search MCP servers"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Featured (only on page 1 without category filter) */}
      {featured && featured.length > 0 && !category && page === 1 && (
        <section class="mb-10" aria-label="Featured MCP servers">
          <h2 class="mb-4 flex items-center gap-1.5 text-lg font-semibold font-heading">
            <Icon name="star" class="size-5 text-yellow-500" />
            Featured
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => <MCPCard server={s} />)}
          </div>
        </section>
      )}

      {/* Main: sidebar + grid */}
      <div class="flex gap-8 pb-12">
        {/* Sidebar */}
        <aside class="hidden w-80 shrink-0 lg:block">
          <MCPCategoryNav
            categories={categories}
            current={category}
            total={allTotal}
          />
        </aside>

        {/* Content */}
        <div class="min-w-0 flex-1">
          {/* Mobile category nav */}
          <div class="mb-4 lg:hidden">
            <MCPCategoryNav
              categories={categories}
              current={category}
              total={allTotal}
            />
          </div>

          {/* Sort + count bar */}
          <div class="mb-4 flex items-center justify-between">
            <p class="text-sm text-muted-foreground">
              {total} {total === 1 ? "server" : "servers"}
              {category ? ` in ${category}` : ""}
            </p>
            <div class="flex items-center gap-2">
              <label for="sort-select" class="text-xs text-muted-foreground">Sort:</label>
              <select
                id="sort-select"
                class="cn-input py-1 text-xs"
                onchange={`window.location.href='/mcp?${category ? 'category=' + category + '&' : ''}sort='+this.value`}
              >
                {MCP_SORT_OPTIONS.map((opt) => (
                  <option value={opt.value} selected={sort === opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          {servers.length > 0 ? (
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {servers.map((s) => <MCPCard server={s} />)}
            </div>
          ) : (
            <div class="py-12 text-center text-muted-foreground">
              <p>No MCP servers found{category ? ` in "${category}"` : ""}.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav class="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
              {page > 1 ? (
                <a
                  href={paginationUrl(category, sort, page - 1)}
                  class="cn-badge cn-badge-variant-secondary"
                >
                  &larr; Prev
                </a>
              ) : (
                <span class="cn-badge cn-badge-variant-secondary opacity-40" aria-disabled="true">
                  &larr; Prev
                </span>
              )}
              <span class="text-sm text-muted-foreground tabular-nums">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <a
                  href={paginationUrl(category, sort, page + 1)}
                  class="cn-badge cn-badge-variant-secondary"
                >
                  Next &rarr;
                </a>
              ) : (
                <span class="cn-badge cn-badge-variant-secondary opacity-40" aria-disabled="true">
                  Next &rarr;
                </span>
              )}
            </nav>
          )}
        </div>
      </div>
    </Container>
  );
};

function paginationUrl(category: string, sort: string, page: number): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort && sort !== "downloads") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/mcp${qs ? `?${qs}` : ""}`;
}
