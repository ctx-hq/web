import type { FC, PropsWithChildren } from "hono/jsx";
import type { PackageDetail as PackageDetailType, ManifestInfo } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { Badge } from "../components/badge";
import { InstallTabs } from "../components/install-tabs";
import { VersionList } from "../components/version-list";
import { TrustBadge } from "../components/trust-badge";
import { VisibilityBadge } from "../components/visibility-badge";
import { PublisherLink } from "../components/publisher-link";
import { DistTagList } from "../components/dist-tag-list";
import { formatNumber, formatDate } from "../lib/format";
import { safeRepoUrl, buildMetadataRows } from "../lib/package-helpers";
import { TRUST_TIERS } from "../lib/constants";

/** Sidebar card wrapper with title. */
const SidebarSection: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div class="cn-card p-4">
    <h3 class="mb-3 text-xs font-semibold font-heading">{title}</h3>
    {children}
  </div>
);

/** Inline key-value row for metadata. */
const MetaRow: FC<{ label: string; value: string | undefined }> = ({ label, value }) =>
  value ? (
    <div class="flex items-center justify-between">
      <dt class="text-muted-foreground">{label}</dt>
      <dd class="font-medium">{value}</dd>
    </div>
  ) : null;

export const PackageDetailPage: FC<{
  pkg: PackageDetailType;
  readmeHtml: string;
  manifest?: ManifestInfo | null;
}> = ({ pkg, readmeHtml, manifest }) => {
  const repoUrl = safeRepoUrl(pkg.repository);
  const rows = buildMetadataRows(pkg, formatNumber, formatDate);
  const isAdapter = !!manifest?.source?.github;
  const sourceGithub = manifest?.source?.github;
  const sourceRef = manifest?.source?.ref;

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
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <h1 class="break-all text-base font-semibold font-heading">
            {pkg.full_name}
          </h1>
          <Badge type={pkg.type} />
          {isAdapter && (
            <Badge variant="outline">adapter</Badge>
          )}
          <VisibilityBadge visibility={pkg.visibility} />
          <TrustBadge tier={pkg.trust_tier} />
        </div>
        {pkg.publisher && (
          <div class="mb-1">
            <PublisherLink slug={pkg.publisher.slug} />
          </div>
        )}
        {pkg.description && (
          <p class="text-sm text-muted-foreground">{pkg.description}</p>
        )}
        {/* Adapter source banner */}
        {isAdapter && sourceGithub && (
          <div class="mt-2 flex items-center gap-1.5 rounded border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
            <Icon name="github-logo" class="size-3.5" />
            <span>
              Adapts{" "}
              <a
                href={`https://github.com/${sourceGithub}`}
                rel="noopener noreferrer"
                class="font-medium text-foreground hover:underline"
              >
                {sourceGithub}
              </a>
              {sourceRef && (
                <span class="ml-1 font-mono text-[10px]">@{sourceRef}</span>
              )}
            </span>
          </div>
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
            <InstallTabs fullName={pkg.full_name} pkgType={pkg.type} manifest={manifest} />
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
                {pkg.publisher && (
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-foreground">Publisher</dt>
                    <dd>
                      <a
                        href={`/publisher/${encodeURIComponent(pkg.publisher.slug)}`}
                        class="text-xs font-medium hover:text-foreground"
                      >
                        @{pkg.publisher.slug}
                      </a>
                    </dd>
                  </div>
                )}
                {pkg.trust_tier && pkg.trust_tier !== "unverified" && TRUST_TIERS[pkg.trust_tier] && (
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-foreground">Trust</dt>
                    <dd><TrustBadge tier={pkg.trust_tier} /></dd>
                  </div>
                )}
                <div class="flex items-center justify-between">
                  <dt class="text-muted-foreground">Stats</dt>
                  <dd>
                    <a
                      href={`/${pkg.full_name}/stats`}
                      class="text-xs font-medium hover:text-foreground"
                    >
                      View stats
                    </a>
                  </dd>
                </div>
              </dl>
            </SidebarSection>
          </div>

          {/* Package capabilities — from manifest */}
          {manifest && (
            manifest.cli?.binary ||
            manifest.cli?.compatible ||
            manifest.mcp?.transport ||
            (manifest.mcp?.tools && manifest.mcp.tools.length > 0) ||
            manifest.skill?.compatibility ||
            manifest.install
          ) && (
            <SidebarSection title="Capabilities">
              <dl class="space-y-2 text-xs">
                {manifest.cli?.binary && (
                  <MetaRow label="Binary" value={manifest.cli.binary} />
                )}
                {manifest.cli?.compatible && (
                  <MetaRow label="Compatible" value={manifest.cli.compatible} />
                )}
                {manifest.mcp?.transport && (
                  <MetaRow label="Transport" value={manifest.mcp.transport} />
                )}
                {manifest.mcp?.tools && manifest.mcp.tools.length > 0 && (
                  <MetaRow label="Tools" value={`${manifest.mcp.tools.length} tools`} />
                )}
                {manifest.skill?.compatibility && (
                  <MetaRow label="Agents" value={manifest.skill.compatibility} />
                )}
                {manifest.install && (
                  <div class="mt-2 flex flex-wrap gap-1">
                    {manifest.install.brew && <Badge variant="outline">brew</Badge>}
                    {manifest.install.npm && <Badge variant="outline">npm</Badge>}
                    {manifest.install.pip && <Badge variant="outline">pip</Badge>}
                    {manifest.install.cargo && <Badge variant="outline">cargo</Badge>}
                  </div>
                )}
              </dl>
            </SidebarSection>
          )}

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

          {/* Dist Tags */}
          {pkg.dist_tags && Object.keys(pkg.dist_tags).length > 0 && (
            <SidebarSection title="Dist Tags">
              <DistTagList tags={pkg.dist_tags} />
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
