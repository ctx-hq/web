import { SITE_NAME, SITE_DESCRIPTION, SITE_URL, DEFAULT_OG_IMAGE } from "./constants";
import type { PackageDetail } from "./types";

export interface SeoMeta {
  title: string;
  description: string;
  url: string;
  ogImage: string;
  type: string;
}

export function defaultMeta(): SeoMeta {
  return {
    title: `${SITE_NAME} — ${SITE_DESCRIPTION}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    ogImage: DEFAULT_OG_IMAGE,
    type: "website",
  };
}

export function searchMeta(query: string): SeoMeta {
  const truncated = query.slice(0, 100);
  return {
    title: `Search: ${truncated} — ${SITE_NAME}`,
    description: `Search results for "${truncated}" on ${SITE_NAME}`,
    url: `${SITE_URL}/search?q=${encodeURIComponent(query)}`,
    ogImage: DEFAULT_OG_IMAGE,
    type: "website",
  };
}

export function packageMeta(pkg: PackageDetail): SeoMeta {
  const desc = pkg.description.slice(0, 200);
  return {
    title: `${pkg.full_name} — ${SITE_NAME}`,
    description: desc || `${pkg.full_name} on ${SITE_NAME}`,
    url: `${SITE_URL}/@${pkg.full_name}`,
    ogImage: DEFAULT_OG_IMAGE,
    type: "article",
  };
}

export function docsMeta(section?: string): SeoMeta {
  const title = section ? `${section} — Docs — ${SITE_NAME}` : `Docs — ${SITE_NAME}`;
  return {
    title,
    description: `Documentation for ${SITE_NAME} — getting started, ctx.yaml spec, API reference.`,
    url: section ? `${SITE_URL}/docs/${encodeURIComponent(section)}` : `${SITE_URL}/docs`,
    ogImage: DEFAULT_OG_IMAGE,
    type: "article",
  };
}

/** Escape HTML special characters to prevent XSS in meta tags. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
