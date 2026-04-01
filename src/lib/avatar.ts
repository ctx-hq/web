const COLORS = ["264653", "2a9d8f", "e9c46a", "f4a261", "e76f51"];

/**
 * Generate a deterministic avatar URL for a slug.
 * Uses a simple SVG data URI with initials — no external service dependency.
 * Falls back gracefully (no broken images if boringavatars.com is down).
 */
export function avatarUrl(slug: string, size: number = 20): string {
  // Deterministic color based on slug hash
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  const color = COLORS[Math.abs(hash) % COLORS.length];
  const initial = (slug[0] ?? "?").toUpperCase();

  // Inline SVG data URI — zero external requests, always works
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="%23${color}"/><text x="50%" y="50%" dy=".1em" fill="white" font-family="system-ui,sans-serif" font-size="${Math.round(size * 0.45)}" font-weight="600" text-anchor="middle" dominant-baseline="central">${initial}</text></svg>`;

  return `data:image/svg+xml,${svg}`;
}
