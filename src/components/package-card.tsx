import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { Badge } from "./badge";

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export const PackageCard: FC<{ pkg: PackageSummary }> = ({ pkg }) => (
  <a
    href={`/@${pkg.full_name}`}
    class="cn-card block transition-colors hover:border-foreground"
  >
    <div class="mb-1 flex items-center justify-between">
      <span class="text-sm font-medium">@{pkg.full_name}</span>
      <Badge type={pkg.type} />
    </div>
    <p class="mb-2 line-clamp-2 text-muted-foreground">{pkg.description}</p>
    <div class="flex items-center gap-3 text-[10px] text-muted-foreground">
      <span>v{pkg.version}</span>
      <span>↓ {formatDownloads(pkg.downloads)}</span>
    </div>
  </a>
);
