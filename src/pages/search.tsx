import type { FC } from "hono/jsx";
import type { PackageSummary, PackageType, SortOption } from "../lib/types";
import { PACKAGE_TYPES, SORT_OPTIONS } from "../lib/constants";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { SearchBox } from "../components/search-box";
import { PackageCard } from "../components/package-card";
import { Badge } from "../components/badge";
import { searchUrl, resultCountText } from "../lib/search-url";

/** Build a filter URL preserving query and sort, resetting page to 1. */
function filterUrl(query: string, type: PackageType | undefined, sort?: string): string {
  return searchUrl(query, type, 1, sort);
}

/** Sort selector — native <select> in a form for SSR compatibility. */
const SortSelect: FC<{
  sort: SortOption;
  query: string;
  type?: PackageType;
}> = ({ sort, query, type }) => (
  <form action="/search" method="get" class="flex items-center gap-1.5">
    {query && <input type="hidden" name="q" value={query} />}
    {type && <input type="hidden" name="type" value={type} />}
    <label for="sort-select" class="text-xs text-muted-foreground">
      Sort:
    </label>
    <select
      name="sort"
      id="sort-select"
      class="cn-input cn-input-size-default w-auto cursor-pointer px-2 text-xs"
      onchange="this.form.submit()"
    >
      {SORT_OPTIONS.map((o) => (
        <option value={o.value} selected={sort === o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <noscript>
      <button
        type="submit"
        class="cn-button cn-button-variant-outline cn-button-size-xs"
      >
        Go
      </button>
    </noscript>
  </form>
);

export const SearchPage: FC<{
  query: string;
  type?: PackageType;
  sort?: SortOption;
  packages: PackageSummary[];
  total: number;
  page?: number;
  totalPages?: number;
}> = ({ query, type, sort = "downloads", packages, total, page = 1, totalPages = 1 }) => {
  const countText = resultCountText(total, query, type);
  const hasResults = packages.length > 0;

  return (
    <Container class="py-8">
      {/* Search bar — full width */}
      <div class="mb-6">
        <SearchBox value={query} selectedType={type} />
      </div>

      {/* Filter bar: type pills left, count + sort right */}
      <div class="mb-6 flex items-center justify-between">
        <nav class="flex gap-2" role="navigation" aria-label="Filter by type">
          <Badge
            variant="default"
            active={!type}
            href={filterUrl(query, undefined, sort)}
            class="px-3 py-1"
            aria-current={!type ? "page" : undefined}
          >
            All
          </Badge>
          {PACKAGE_TYPES.map((t) => (
            <Badge
              type={t}
              active={type === t}
              href={filterUrl(query, t, sort)}
              class="px-3 py-1"
              aria-current={type === t ? "page" : undefined}
            />
          ))}
        </nav>

        <div class="flex items-center gap-4">
          <p class="text-xs text-muted-foreground" aria-live="polite">
            {countText}
            {hasResults && totalPages > 1
              ? ` \u2014 page ${page} of ${totalPages}`
              : ""}
          </p>
          {/* Sort: only in browse mode (no query), search API returns by relevance */}
          {!query && <SortSelect sort={sort} query={query} type={type} />}
        </div>
      </div>

      {/* Results grid or empty state */}
      {hasResults ? (
        <>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.full_name} pkg={pkg} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              class="mt-8 flex items-center justify-center gap-3"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  href={searchUrl(query, type, page - 1, sort)}
                >
                  <Icon name="arrow-right" class="size-3 rotate-180" />
                  Prev
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Icon name="arrow-right" class="size-3 rotate-180" />
                  Prev
                </Button>
              )}
              <span class="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Button
                  variant="outline"
                  size="sm"
                  href={searchUrl(query, type, page + 1, sort)}
                >
                  Next
                  <Icon name="arrow-right" class="size-3" />
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                  <Icon name="arrow-right" class="size-3" />
                </Button>
              )}
            </nav>
          )}
        </>
      ) : query ? (
        <div class="py-12 text-center">
          <p class="mb-2 text-sm text-muted-foreground">
            No packages found for &ldquo;{query}&rdquo;
          </p>
          <p class="text-xs text-muted-foreground">
            Try a different search term or{" "}
            <a href="/search" class="underline hover:text-foreground">
              browse all packages
            </a>
            .
          </p>
        </div>
      ) : (
        <div class="cn-card p-12 text-center">
          <p class="mb-2 text-sm text-muted-foreground">No packages yet</p>
          <p class="text-xs text-muted-foreground">
            Be the first to publish:&nbsp;
            <code class="bg-muted px-2 py-0.5 font-mono text-xs">
              ctx publish
            </code>
          </p>
        </div>
      )}
    </Container>
  );
};
