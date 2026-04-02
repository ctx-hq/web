import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { formatDownloads } from "../lib/format";
import { Badge } from "./badge";
import { Card } from "./ui/card";
import { Icon } from "./ui/icon";
import { TrustBadge } from "./trust-badge";
import { VisibilityBadge } from "./visibility-badge";

export const PackageCard: FC<{ pkg: PackageSummary; showSettings?: boolean }> = ({ pkg, showSettings }) => (
  <div class="cn-card relative transition-all hover:ring-foreground/25">
    <a href={`/package/${pkg.full_name}`} class="block p-5">
      <div class="mb-1 flex items-center justify-between gap-1">
        <span class="min-w-0 truncate text-sm font-medium font-heading">{pkg.full_name}</span>
        <div class="flex shrink-0 items-center gap-1">
          <VisibilityBadge visibility={pkg.visibility} />
          <Badge type={pkg.type} />
        </div>
      </div>
      {(pkg.trust_tier || pkg.owner_slug) && (
        <div class="mb-1 flex items-center gap-2">
          <TrustBadge tier={pkg.trust_tier} />
          {pkg.owner_slug && (
            <span class="text-xs text-muted-foreground">@{pkg.owner_slug}</span>
          )}
        </div>
      )}
      <p class="mb-2 line-clamp-2 text-sm text-muted-foreground">{pkg.description}</p>
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        {pkg.version && <span>v{pkg.version}</span>}
        <span class="inline-flex items-center gap-0.5">
          <Icon name="download" class="size-3" />
          {formatDownloads(pkg.downloads)}
        </span>
      </div>
    </a>
    {showSettings && (
      <a
        href={`/package/${pkg.full_name}/settings`}
        class="absolute top-2 right-2 cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-foreground"
        aria-label={`Settings for ${pkg.full_name}`}
      >
        <Icon name="settings" class="size-3.5" />
      </a>
    )}
  </div>
);
