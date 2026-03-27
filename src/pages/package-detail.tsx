import type { FC, PropsWithChildren } from "hono/jsx";
import type { PackageDetail as PackageDetailType } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { Badge } from "../components/badge";
import { InstallTabs } from "../components/install-tabs";
import { VersionList } from "../components/version-list";
import { formatNumber, formatDate } from "../lib/format";
import { safeRepoUrl, buildMetadataRows } from "../lib/package-helpers";

/** Sidebar card wrapper with title. */
const SidebarSection: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div class="cn-card p-4">
    <h3 class="mb-3 text-xs font-semibold font-heading">{title}</h3>
    {children}
  </div>
);

export const PackageDetailPage: FC<{
  pkg: PackageDetailType;
  readmeHtml: string;
}> = ({ pkg, readmeHtml }) => {
  const repoUrl = safeRepoUrl(pkg.repository);
  const rows = buildMetadataRows(pkg, formatNumber, formatDate);

  return (
    <Container class="py-8">
      {/* Back navigation */}
      <a
        href="/search"
        class="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Icon name="arrow-right" class="size-3 rotate-180" />
        Back to search
      </a>

      {/* Package header */}
      <div class="mb-6">
        <div class="mb-2 flex items-center gap-3">
          <h1 class="break-all text-base font-semibold font-heading">
            @{pkg.full_name}
          </h1>
          <Badge type={pkg.type} />
        </div>
        {pkg.description && (
          <p class="text-sm text-muted-foreground">{pkg.description}</p>
        )}
      </div>

      {/* Mobile compact metadata — only visible below lg */}
      <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground lg:hidden">
        {pkg.versions.length > 0 && <span>v{pkg.versions[0].version}</span>}
        {pkg.license && <span>{pkg.license}</span>}
        <span class="inline-flex items-center gap-0.5">
          <Icon name="download" class="size-3" />
          {formatNumber(pkg.downloads)}
        </span>
        {repoUrl && (
          <a
            href={repoUrl}
            rel="noopener noreferrer"
            class="inline-flex items-center gap-0.5 hover:text-foreground"
          >
            <Icon name="github-logo" class="size-3" />
            Repository
          </a>
        )}
      </div>

      {/* Main + Sidebar layout */}
      <div class="lg:flex lg:gap-8">
        {/* Main content */}
        <div class="min-w-0 flex-1">
          {/* Install */}
          <div class="mb-8">
            <InstallTabs fullName={pkg.full_name} />
          </div>

          {/* README */}
          {readmeHtml ? (
            <div
              class="prose"
              dangerouslySetInnerHTML={{ __html: readmeHtml }}
            />
          ) : (
            <p class="text-xs text-muted-foreground">No README available.</p>
          )}
        </div>

        {/* Sidebar — sticky on desktop, stacked on mobile */}
        <aside class="mt-8 w-full space-y-4 lg:mt-0 lg:w-72 lg:shrink-0 lg:sticky lg:top-6 lg:self-start">
          {/* Metadata card */}
          <div class="hidden lg:block">
            <SidebarSection title="Details">
              <dl class="space-y-2 text-xs">
                {rows.map((row) => (
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-foreground">{row.label}</dt>
                    <dd class="font-medium">{row.value}</dd>
                  </div>
                ))}
                {repoUrl && (
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-foreground">Repository</dt>
                    <dd>
                      <a
                        href={repoUrl}
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground"
                      >
                        <Icon name="github-logo" class="size-3" />
                        GitHub
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </SidebarSection>
          </div>

          {/* Keywords */}
          {pkg.keywords.length > 0 && (
            <SidebarSection title="Keywords">
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
            </SidebarSection>
          )}

          {/* Platforms */}
          {pkg.platforms.length > 0 && (
            <SidebarSection title="Platforms">
              <div class="flex flex-wrap gap-1">
                {pkg.platforms.map((p) => (
                  <Badge variant="outline">{p}</Badge>
                ))}
              </div>
            </SidebarSection>
          )}

          {/* Versions */}
          {pkg.versions.length > 0 && (
            <SidebarSection title="Versions">
              <VersionList versions={pkg.versions.slice(0, 10)} />
            </SidebarSection>
          )}
        </aside>
      </div>
    </Container>
  );
};
