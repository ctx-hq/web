import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { formatDownloads } from "../lib/format";
import { Badge } from "./badge";
import { Card } from "./ui/card";
import { Icon } from "./ui/icon";
import { TrustBadge } from "./trust-badge";
import { VisibilityBadge } from "./visibility-badge";

export const PackageCard: FC<{ pkg: PackageSummary }> = ({ pkg }) => (
  <a
    href={`/${pkg.full_name}`}
    class="cn-card block transition-all hover:ring-foreground/25"
  >
    <div class="p-5">
      <div class="mb-1 flex items-center justify-between gap-1">
        <span class="min-w-0 truncate text-sm font-medium font-heading">{pkg.full_name}</span>
        <div class="flex shrink-0 items-center gap-1">
          <VisibilityBadge visibility={pkg.visibility} />
          <Badge type={pkg.type} />
        </div>
      </div>
      {(pkg.trust_tier || pkg.publisher_slug) && (
        <div class="mb-1 flex items-center gap-2">
          <TrustBadge tier={pkg.trust_tier} />
          {pkg.publisher_slug && (
            <span class="text-xs text-muted-foreground">@{pkg.publisher_slug}</span>
          )}
        </div>
      )}
      <p class="mb-2 line-clamp-2 text-sm text-muted-foreground">{pkg.description}</p>
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <span>v{pkg.version}</span>
        <span class="inline-flex items-center gap-0.5">
          <Icon name="download" class="size-3" />
          {formatDownloads(pkg.downloads)}
        </span>
      </div>
    </div>
  </a>
);
