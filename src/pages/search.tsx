import type { FC } from "hono/jsx";
import type { PackageSummary, PackageType } from "../lib/types";
import { PACKAGE_TYPES } from "../lib/constants";
import { SearchBox } from "../components/search-box";
import { PackageCard } from "../components/package-card";

export const SearchPage: FC<{
  query: string;
  type?: PackageType;
  packages: PackageSummary[];
  total: number;
}> = ({ query, type, packages, total }) => (
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-6 max-w-md">
      <SearchBox value={query} />
    </div>

    {/* Type filter pills */}
    <div class="mb-6 flex gap-2">
      <a
        href={`/search?q=${encodeURIComponent(query)}`}
        class={`cn-badge ${!type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
      >
        All
      </a>
      {PACKAGE_TYPES.map((t) => (
        <a
          href={`/search?q=${encodeURIComponent(query)}&type=${t}`}
          class={`cn-badge ${type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
        >
          {t}
        </a>
      ))}
    </div>

    {/* Results */}
    {packages.length === 0 ? (
      <div class="py-12 text-center text-muted-foreground">
        <p class="mb-2 text-sm">No packages found for "{query}"</p>
        <p>Try a different search term or browse by type.</p>
      </div>
    ) : (
      <>
        <p class="mb-4 text-muted-foreground">{total} result{total !== 1 ? "s" : ""}</p>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard pkg={pkg} />
          ))}
        </div>
      </>
    )}
  </div>
);
