import type { FC, PropsWithChildren } from "hono/jsx";
import type { PackageDetail as PackageDetailType, ManifestInfo, MCPDetail } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { Badge } from "../components/badge";
import { InstallTabs } from "../components/install-tabs";
import { VersionList } from "../components/version-list";
import { TrustBadge } from "../components/trust-badge";
import { VisibilityBadge } from "../components/visibility-badge";
import { OwnerLink } from "../components/owner-link";
import { DistTagList } from "../components/dist-tag-list";
import { MCPAgentConfigs } from "../components/mcp-agent-configs";
import { MCPToolsList } from "../components/mcp-tools-list";
import { MCPEnvVars } from "../components/mcp-env-vars";
import { MCPCompatibility } from "../components/mcp-compatibility";
import { UpstreamBadge } from "../components/upstream-badge";
import { formatNumber, formatDate, splitPackageName } from "../lib/format";
import { safeRepoUrl, buildMetadataRows } from "../lib/package-helpers";
import { TRUST_TIERS, MCP_TRANSPORT_LABELS } from "../lib/constants";

/** Sidebar card wrapper with title. */
const SidebarSection: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div class="cn-card p-5">
    <h3 class="mb-3 text-sm font-semibold font-heading">{title}</h3>
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
  mcpDetail?: MCPDetail | null;
  isLoggedIn?: boolean;
  canManage?: boolean;
}> = ({ pkg, readmeHtml, manifest, mcpDetail, isLoggedIn, canManage }) => {
  const repoUrl = safeRepoUrl(pkg.repository);
  const rows = buildMetadataRows(pkg, formatNumber, formatDate);
  const { scope, shortName } = splitPackageName(pkg.full_name);
  const isAdapter = !!manifest?.source?.github;
  const sourceGithub = manifest?.source?.github;
  const sourceRef = manifest?.source?.ref;

  return (
    <Container class="py-10">
      {/* Breadcrumb navigation */}
      <nav class="mb-4 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-1">
          <li><a href="/" class="hover:text-foreground">Home</a></li>
          <li><span aria-hidden="true">/</span></li>
          <li><a href="/search" class="hover:text-foreground">Packages</a></li>
          <li><span aria-hidden="true">/</span></li>
          <li class="min-w-0 truncate text-foreground" aria-current="page">{pkg.full_name}</li>
        </ol>
      </nav>

      {/* Package header */}
      <div class="mb-6">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <h1 class="break-all text-xl font-heading">
            {scope && <span class="font-normal text-muted-foreground">{scope}/</span>}
            <span class="font-semibold">{shortName}</span>
          </h1>
          <Badge type={pkg.type} />
          {isAdapter && (
            <Badge variant="outline">adapter</Badge>
          )}
          <VisibilityBadge visibility={pkg.visibility} />
          <TrustBadge tier={pkg.trust_tier} />
          {canManage && (
            <a
              href={`/package/${pkg.full_name}/settings`}
              class="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Package settings"
            >
              <Icon name="settings" class="size-3.5" />
              Settings
            </a>
          )}
        </div>
        {pkg.owner && (
          <div class="mb-1">
            <OwnerLink slug={pkg.owner.slug} avatar={pkg.owner.avatar_url} />
          </div>
        )}
        {pkg.description && (
          <p class="text-base text-muted-foreground">{pkg.description}</p>
        )}
        {/* Adapter source banner */}
        {isAdapter && sourceGithub && (
          <div class="mt-2 flex items-center gap-1.5 border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
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
                <span class="ml-1 font-mono text-xs">@{sourceRef}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Mobile compact metadata — only visible below lg */}
      <div class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:hidden">
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

      {/* Part of Collection */}
      {pkg.part_of_collections && pkg.part_of_collections.length > 0 && (
        <div class="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Part of:</span>
          {pkg.part_of_collections.map((col) => (
            <a href={`/package/${col.full_name}`} class="cn-badge cn-badge-variant-type-collection hover:opacity-80 transition-opacity">
              {col.full_name}
            </a>
          ))}
        </div>
      )}

      {/* Main + Sidebar layout */}
      <div class="lg:flex lg:gap-8">
        {/* Main content */}
        <div class="min-w-0 flex-1">
          {/* Install */}
          <div class="mb-8">
            <InstallTabs fullName={pkg.full_name} pkgType={pkg.type} manifest={manifest} />
            {/* MCP: per-agent configuration snippets */}
            {pkg.type === "mcp" && manifest?.mcp && (
              <MCPAgentConfigs
                shortName={pkg.full_name.split("/").pop() ?? pkg.full_name}
                manifest={manifest}
              />
            )}
            {/* Upstream source badge */}
            {manifest?.upstream && (
              <div class="mt-3">
                <UpstreamBadge upstream={manifest.upstream} />
              </div>
            )}
            {/* Prerequisites */}
            {manifest?.mcp?.require?.bins && manifest.mcp.require.bins.length > 0 && (
              <div class="mt-3 text-xs text-muted-foreground">
                <span class="font-medium">Requires:</span>{" "}
                {manifest.mcp.require.bins.map((bin, i) => {
                  const minVer = manifest.mcp?.require?.min_versions?.[bin];
                  return (
                    <span>
                      {i > 0 && ", "}
                      {bin}{minVer ? ` ${minVer}+` : ""}
                    </span>
                  );
                })}
              </div>
            )}
            {/* Post-install hooks */}
            {manifest?.mcp?.hooks?.post_install && manifest.mcp.hooks.post_install.length > 0 && (
              <div class="mt-2 text-xs text-muted-foreground">
                <span class="font-medium">After install:</span>{" "}
                {manifest.mcp.hooks.post_install.map((h) => h.description ?? `${h.command} ${(h.args ?? []).join(" ")}`).join("; ")}
              </div>
            )}
          </div>

          {/* Collection Members */}
          {pkg.type === "collection" && pkg.collection_members && pkg.collection_members.length > 0 && (
            <div class="mb-8">
              <h2 class="mb-4 text-lg font-semibold font-heading">
                Included Packages ({pkg.collection_members.length})
              </h2>
              <div class="grid gap-3 sm:grid-cols-2">
                {pkg.collection_members.map((member) => (
                  <a
                    href={`/package/${member.full_name}`}
                    class="cn-card block p-4 transition-all hover:ring-1 hover:ring-foreground/25"
                  >
                    <div class="mb-1 flex items-center justify-between gap-1">
                      <span class="min-w-0 truncate text-sm font-medium font-heading">{member.full_name}</span>
                      <Badge type={member.type} />
                    </div>
                    <p class="line-clamp-2 text-xs text-muted-foreground">{member.description}</p>
                    {member.version && (
                      <span class="mt-1 inline-block text-xs text-muted-foreground">v{member.version}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* README */}
          {readmeHtml ? (
            <div
              class="prose max-w-full"
              dangerouslySetInnerHTML={{ __html: readmeHtml }}
            />
          ) : (
            <p class="text-sm text-muted-foreground">No README available.</p>
          )}
        </div>

        {/* Sidebar — sticky on desktop, stacked on mobile */}
        <aside class="mt-8 w-full space-y-4 lg:mt-0 lg:w-80 lg:shrink-0 lg:sticky lg:top-6 lg:self-start">
          {/* Star button */}
          <div class="cn-card p-4">
            <div class="flex items-center justify-between">
              {isLoggedIn ? (
                <form method="post" action={`/package/${pkg.full_name}/${pkg.is_starred ? "unstar" : "star"}`}>
                  <button
                    type="submit"
                    class={`cn-button cn-button-variant-outline cn-button-size-xs inline-flex items-center gap-1.5 ${
                      pkg.is_starred ? "text-star" : ""
                    }`}
                    aria-label={pkg.is_starred ? `Unstar ${pkg.full_name}` : `Star ${pkg.full_name}`}
                  >
                    <Icon name="star" class={`size-4 ${pkg.is_starred ? "text-star" : ""}`} />
                    {pkg.is_starred ? "Starred" : "Star"}
                  </button>
                </form>
              ) : (
                <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Icon name="star" class="size-4" />
                  Stars
                </span>
              )}
              <span class="text-sm font-medium tabular-nums">{formatNumber(pkg.star_count ?? 0)}</span>
            </div>
          </div>

          {/* Metadata card */}
          <div class="hidden lg:block">
            <SidebarSection title="Details">
              <dl class="space-y-2 text-sm">
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
                {pkg.owner && (
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-foreground">Owner</dt>
                    <dd>
                      <a
                        href={`/@${encodeURIComponent(pkg.owner.slug)}`}
                        class="text-xs font-medium hover:text-foreground"
                      >
                        @{pkg.owner.slug}
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
                      href={`/package/${pkg.full_name}/stats`}
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
              <dl class="space-y-2 text-sm">
                {manifest.cli?.binary && (
                  <MetaRow label="Binary" value={manifest.cli.binary} />
                )}
                {manifest.cli?.compatible && (
                  <MetaRow label="Compatible" value={manifest.cli.compatible} />
                )}
                {manifest.mcp?.transport && (
                  <MetaRow label="Transport" value={MCP_TRANSPORT_LABELS[manifest.mcp.transport] ?? manifest.mcp.transport} />
                )}
                {manifest.mcp?.tools && manifest.mcp.tools.length > 0 && (
                  <MCPToolsList tools={manifest.mcp.tools} />
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

          {/* MCP: Environment Variables */}
          {pkg.type === "mcp" && mcpDetail && mcpDetail.env_vars.length > 0 && (
            <SidebarSection title="Environment">
              <MCPEnvVars vars={mcpDetail.env_vars as Array<{ name: string; required?: boolean; default?: string; description?: string }>} />
            </SidebarSection>
          )}

          {/* MCP: Agent Compatibility */}
          {pkg.type === "mcp" && manifest?.mcp?.transport && (
            <SidebarSection title="Compatibility">
              <MCPCompatibility transport={manifest.mcp.transport} />
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
