/** Pure helper functions for the package detail page. */

/** Validate a repository URL — only allow http/https schemes. Returns null for invalid URLs. */
export function safeRepoUrl(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch { /* invalid URL */ }
  return null;
}

export interface MetadataRow {
  label: string;
  value: string;
}

/** Build visible metadata rows from package data. Empty fields are omitted. */
export function buildMetadataRows(pkg: {
  versions: { version: string }[];
  license: string;
  downloads: number;
  created_at: string;
  updated_at: string;
}, formatNumber: (n: number) => string, formatDate: (s: string) => string): MetadataRow[] {
  const rows: MetadataRow[] = [];
  if (pkg.versions.length > 0) rows.push({ label: "Version", value: pkg.versions[0].version });
  if (pkg.license) rows.push({ label: "License", value: pkg.license });
  rows.push({ label: "Downloads", value: formatNumber(pkg.downloads) });
  if (pkg.created_at) rows.push({ label: "Published", value: formatDate(pkg.created_at) });
  if (pkg.updated_at) rows.push({ label: "Updated", value: formatDate(pkg.updated_at) });
  return rows;
}
