/** Format a number with comma separators (locale-independent). */
export function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a number as compact download count (e.g., 1.2k, 3.4M). */
export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Format a date string as YYYY-MM-DD (locale-independent). */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().slice(0, 10);
}

/** Split "@scope/name" into scope and short name for display. */
export function splitPackageName(fullName: string): { scope: string; shortName: string } {
  const idx = fullName.indexOf("/");
  if (idx === -1) return { scope: "", shortName: fullName };
  return { scope: fullName.slice(0, idx), shortName: fullName.slice(idx + 1) };
}
