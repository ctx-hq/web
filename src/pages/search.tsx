import type { FC } from "hono/jsx";
import type { PackageSummary, PackageType } from "../lib/types";
import { PACKAGE_TYPES } from "../lib/constants";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { SearchBox } from "../components/search-box";
import { PackageCard } from "../components/package-card";
import { Badge } from "../components/badge";

/** Build a search URL preserving current query/type and setting the page. */
function searchUrl(query: string, type: PackageType | undefined, page: number): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (type) params.set("type", type);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export const SearchPage: FC<{
  query: string;
  type?: PackageType;
  packages: PackageSummary[];
  total: number;
  page?: number;
  totalPages?: number;
}> = ({ query, type, packages, total, page = 1, totalPages = 1 }) => (
  <Container class="py-8">
    <div class="mb-6 max-w-lg">
      <SearchBox value={query} />
    </div>

    {/* Type filter pills — SSOT via Badge component */}
    <div class="mb-6 flex gap-2">
      <Badge
        variant="default"
        active={!type}
        href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
        class="px-3 py-1"
      >
        All
      </Badge>
      {PACKAGE_TYPES.map((t) => (
        <Badge
          type={t}
          active={type === t}
          href={
            query
              ? `/search?q=${encodeURIComponent(query)}&type=${t}`
              : `/search?type=${t}`
          }
          class="px-3 py-1"
        />
      ))}
    </div>

    {/* Results */}
    {!query && !type && packages.length === 0 ? (
      <div class="py-16 text-center">
        <p class="mb-2 text-sm text-muted-foreground">Search for packages</p>
        <p class="text-xs text-muted-foreground">
          Or browse by type using the filters above.
        </p>
      </div>
    ) : packages.length === 0 ? (
      <div class="py-12 text-center">
        <p class="mb-2 text-sm text-muted-foreground">
          No packages found{query ? ` for "${query}"` : ""}
        </p>
        <p class="text-xs text-muted-foreground">Try a different search term or browse by type.</p>
      </div>
    ) : (
      <>
        <p class="mb-4 text-xs text-muted-foreground">
          {total} result{total !== 1 ? "s" : ""}
          {query ? ` for "${query}"` : ""}
          {type ? ` in ${type}` : ""}
          {totalPages > 1 ? ` — page ${page} of ${totalPages}` : ""}
        </p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.full_name} pkg={pkg} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav class="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
            {page > 1 ? (
              <Button variant="outline" size="sm" href={searchUrl(query, type, page - 1)}>
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
              <Button variant="outline" size="sm" href={searchUrl(query, type, page + 1)}>
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
    )}
  </Container>
);
