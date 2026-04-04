import type { FC } from "hono/jsx";
import type { PackageSummary, KeywordInfo } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { PackageCard } from "../components/package-card";

export const KeywordDetailPage: FC<{
  keyword: KeywordInfo;
  packages: PackageSummary[];
  total: number;
  page: number;
  totalPages: number;
}> = ({ keyword, packages, total, page, totalPages }) => {
  const pageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/keywords/${encodeURIComponent(keyword.slug)}${qs ? `?${qs}` : ""}`;
  };

  return (
    <Container class="py-10">
      {/* Breadcrumb */}
      <nav class="mb-4" aria-label="Breadcrumb">
        <a href="/keywords" class="text-sm text-muted-foreground hover:text-foreground">
          <Icon name="arrow-right" class="mr-1 inline size-3 rotate-180" />
          Keywords
        </a>
      </nav>

      <h1 class="mb-1 text-xl font-semibold font-heading">
        &ldquo;{keyword.slug}&rdquo;
      </h1>
      <p class="mb-6 text-sm text-muted-foreground">
        {total} package{total !== 1 ? "s" : ""}
      </p>

      {packages.length > 0 ? (
        <>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                <Button variant="outline" size="sm" href={pageUrl(page - 1)}>
                  <Icon name="arrow-right" class="size-3 rotate-180" />
                  Prev
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Icon name="arrow-right" class="size-3 rotate-180" />
                  Prev
                </Button>
              )}
              <span class="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Button variant="outline" size="sm" href={pageUrl(page + 1)}>
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
      ) : (
        <div class="py-12 text-center">
          <p class="text-sm text-muted-foreground">
            No packages found with this keyword.
          </p>
        </div>
      )}
    </Container>
  );
};
