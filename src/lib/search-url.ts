import type { PackageType, SortOption } from "./types";

const VALID_SORTS: readonly string[] = ["downloads", "newest"];
const DEFAULT_SORT: SortOption = "downloads";

/** Validate and normalize a sort parameter from URL query string. */
export function validateSort(raw: string | undefined): SortOption {
  if (raw && VALID_SORTS.includes(raw)) return raw as SortOption;
  return DEFAULT_SORT;
}

/** Build a search URL preserving query/type/sort and setting the page. */
export function searchUrl(
  query: string,
  type: PackageType | undefined,
  page: number,
  sort?: string,
): string {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (type) params.set("type", type);
  if (sort && sort !== DEFAULT_SORT) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

/** Generate human-readable result count text. */
export function resultCountText(total: number, query: string, type?: string): string {
  const noun = query
    ? total === 1 ? "result" : "results"
    : total === 1 ? "package" : "packages";

  if (!query && type) {
    // "10 mcp packages" — insert type before noun
    return `${total} ${type} ${noun}`;
  }
  if (query) {
    const base = type ? `${total} ${type} ${noun}` : `${total} ${noun}`;
    return `${base} for \u201c${query}\u201d`;
  }
  return `${total} ${noun}`;
}
