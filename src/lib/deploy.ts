/**
 * Cloudflare Pages routing configuration.
 * Used by scripts/post-build.ts to generate dist/_routes.json.
 *
 * @see https://developers.cloudflare.com/pages/configuration/serving-pages/#routing-configuration
 */
export const ROUTES_CONFIG = {
  version: 1,
  include: ["/*"],
  exclude: ["/favicon.svg", "/robots.txt", "/static/*"],
} as const;
