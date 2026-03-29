import type { FC } from "hono/jsx";
import type { PackageSummary, OrgInfo, SyncProfileMeta } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { PackageCard } from "../components/package-card";
import { SyncPanel } from "../components/sync-panel";
import { Badge } from "../components/badge";

const TABS = [
  { key: "packages", label: "My Packages", href: "/dashboard" },
  { key: "orgs", label: "My Orgs", href: "/dashboard?tab=orgs" },
  { key: "sync", label: "Sync", href: "/dashboard?tab=sync" },
] as const;

export const DashboardPage: FC<{
  username: string;
  packages: PackageSummary[];
  orgs?: OrgInfo[];
  syncMeta?: SyncProfileMeta | null;
  activeTab?: string;
}> = ({ username, packages, orgs = [], syncMeta = null, activeTab = "packages" }) => (
  <Container class="py-8">
    <h1 class="mb-6 text-base font-semibold font-heading">Dashboard</h1>
    <p class="mb-4 text-xs text-muted-foreground">Signed in as @{username}</p>

    {/* Tab navigation */}
    <nav class="mb-6 flex gap-4 border-b border-border" aria-label="Dashboard tabs">
      {TABS.map((tab) => (
        <a
          href={tab.href}
          class={`pb-2 text-xs transition-colors ${
            activeTab === tab.key
              ? "border-b-2 border-foreground font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          {...(activeTab === tab.key ? { "aria-current": "page" } : {})}
        >
          {tab.label}
        </a>
      ))}
    </nav>

    {/* My Packages tab */}
    {activeTab === "packages" && (
      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xs font-semibold font-heading">My packages</h2>
          <Button variant="outline" size="xs" href="/docs/publish">
            Publish a package
            <Icon name="arrow-right" class="size-3" />
          </Button>
        </div>
        {packages.length === 0 ? (
          <div class="cn-card p-6 text-center">
            <p class="text-xs text-muted-foreground">No packages published yet.</p>
            <p class="mt-2">
              <code class="bg-muted px-2 py-1 font-mono text-xs">ctx publish</code>
            </p>
          </div>
        ) : (
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PackageCard key={pkg.full_name} pkg={pkg} />
            ))}
          </div>
        )}
      </section>
    )}

    {/* My Orgs tab */}
    {activeTab === "orgs" && (
      <section>
        <h2 class="mb-4 text-xs font-semibold font-heading">My organizations</h2>
        {orgs.length === 0 ? (
          <div class="cn-card p-6 text-center">
            <p class="text-xs text-muted-foreground">You are not a member of any organizations.</p>
          </div>
        ) : (
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <a
                href={`/org/${encodeURIComponent(org.name)}`}
                class="cn-card block p-4 transition-all hover:ring-foreground/25"
              >
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-xs font-medium font-heading">{org.display_name || org.name}</span>
                  {org.role && <Badge variant="secondary">{org.role}</Badge>}
                </div>
                <p class="text-[10px] text-muted-foreground">@{org.name}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    )}

    {/* Sync tab */}
    {activeTab === "sync" && (
      <section>
        <h2 class="mb-4 text-xs font-semibold font-heading">Sync profile</h2>
        <SyncPanel meta={syncMeta} />
      </section>
    )}
  </Container>
);
