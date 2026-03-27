import type { FC } from "hono/jsx";
import type { PackageDetail as PackageDetailType } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { Badge } from "../components/badge";
import { InstallTabs } from "../components/install-tabs";
import { VersionList } from "../components/version-list";
import { formatNumber } from "../lib/format";

function safeRepoUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch { /* invalid URL */ }
  return null;
}

export const PackageDetailPage: FC<{
  pkg: PackageDetailType;
  readmeHtml: string;
}> = ({ pkg, readmeHtml }) => (
  <Container class="py-8">
    {/* Header */}
    <div class="mb-6">
      <div class="mb-2 flex items-center gap-3">
        <h1 class="text-base font-semibold font-heading">@{pkg.full_name}</h1>
        <Badge type={pkg.type} />
      </div>
      <p class="mb-3 text-xs text-muted-foreground">{pkg.description}</p>
      <div class="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
        {pkg.versions.length > 0 && (
          <span>v{pkg.versions[0].version}</span>
        )}
        {pkg.license && <span>{pkg.license}</span>}
        <span class="inline-flex items-center gap-0.5">
          <Icon name="download" class="size-3" />
          {formatNumber(pkg.downloads)}
        </span>
        {pkg.repository && safeRepoUrl(pkg.repository) && (
          <a
            href={safeRepoUrl(pkg.repository)!}
            rel="noopener noreferrer"
            class="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
          >
            <Icon name="github-logo" class="size-3" />
            Repository
          </a>
        )}
      </div>
    </div>

    {/* Install */}
    <div class="mb-8">
      <InstallTabs fullName={pkg.full_name} />
    </div>

    {/* Content grid */}
    <div class="grid gap-8 lg:grid-cols-[1fr_240px]">
      {/* README */}
      <div>
        {readmeHtml ? (
          <div class="prose" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        ) : (
          <p class="text-xs text-muted-foreground">No README available.</p>
        )}
      </div>

      {/* Sidebar */}
      <aside class="space-y-6">
        {pkg.versions.length > 0 && (
          <VersionList versions={pkg.versions.slice(0, 10)} />
        )}

        {pkg.keywords.length > 0 && (
          <div>
            <h3 class="mb-2 text-xs font-semibold font-heading">Keywords</h3>
            <div class="flex flex-wrap gap-1">
              {pkg.keywords.map((kw) => (
                <Badge
                  variant="secondary"
                  href={`/search?q=${encodeURIComponent(kw)}`}
                >
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pkg.platforms.length > 0 && (
          <div>
            <h3 class="mb-2 text-xs font-semibold font-heading">Platforms</h3>
            <div class="flex flex-wrap gap-1">
              {pkg.platforms.map((p) => (
                <Badge variant="outline">{p}</Badge>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  </Container>
);
