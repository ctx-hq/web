import type { FC } from "hono/jsx";
import type { PackageSummary, OrgInfo, OrgInvitation, SyncProfileMeta, TransferRequest, AppNotification } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { PackageCard } from "../components/package-card";
import { SyncPanel } from "../components/sync-panel";
import { Badge } from "../components/badge";

const TABS = [
  { key: "packages", label: "My Packages", href: "/dashboard" },
  { key: "orgs", label: "My Orgs", href: "/dashboard?tab=orgs" },
  { key: "notifications", label: "Notifications", href: "/dashboard?tab=notifications" },
  { key: "sync", label: "Sync", href: "/dashboard?tab=sync" },
] as const;

export const DashboardPage: FC<{
  username: string;
  packages: PackageSummary[];
  orgs?: OrgInfo[];
  invitations?: OrgInvitation[];
  transfers?: TransferRequest[];
  notifications?: AppNotification[];
  notificationCount?: number;
  syncMeta?: SyncProfileMeta | null;
  activeTab?: string;
}> = ({ username, packages, orgs = [], invitations = [], transfers = [], notifications = [], notificationCount = 0, syncMeta = null, activeTab = "packages" }) => (
  <Container class="py-10">
    <h1 class="mb-6 text-xl font-semibold font-heading">Dashboard</h1>
    <p class="mb-4 text-sm text-muted-foreground">Signed in as @{username}</p>

    {/* Tab navigation */}
    <nav class="mb-6 flex gap-4 border-b border-border" aria-label="Dashboard tabs">
      {TABS.map((tab) => (
        <a
          href={tab.href}
          class={`pb-2 text-sm transition-colors ${
            activeTab === tab.key
              ? "border-b-2 border-foreground font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          {...(activeTab === tab.key ? { "aria-current": "page" } : {})}
        >
          {tab.label}
          {tab.key === "notifications" && notificationCount > 0 && (
            <span class="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </a>
      ))}
    </nav>

    {/* My Packages tab */}
    {activeTab === "packages" && (
      <section>
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold font-heading">My packages</h2>
          <Button variant="outline" size="xs" href="/docs/publish">
            Publish a package
            <Icon name="arrow-right" class="size-3" />
          </Button>
        </div>
        {packages.length === 0 ? (
          <div class="cn-card p-6 text-center">
            <p class="text-sm text-muted-foreground">No packages published yet.</p>
            <p class="mt-2">
              <code class="bg-muted px-2 py-1 font-mono text-xs">ctx publish</code>
            </p>
          </div>
        ) : (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        {/* Pending invitations */}
        {invitations.filter((i) => i.status === "pending").length > 0 && (
          <div class="mb-6">
            <h2 class="mb-3 text-sm font-semibold font-heading">
              Pending Invitations ({invitations.filter((i) => i.status === "pending").length})
            </h2>
            <div class="space-y-2">
              {invitations.filter((i) => i.status === "pending").map((inv) => (
                <div class="cn-card flex items-center justify-between p-4">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">
                      @{inv.org_name}
                    </span>
                    {inv.org_display_name && (
                      <span class="text-xs text-muted-foreground">
                        {inv.org_display_name}
                      </span>
                    )}
                    <Badge variant="secondary">{inv.role}</Badge>
                    <span class="text-xs text-muted-foreground">
                      from {inv.inviter}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <form method="post" action={`/invitations/${inv.id}/accept`}>
                      <button
                        type="submit"
                        class="cn-button-size-xs bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Accept
                      </button>
                    </form>
                    <form method="post" action={`/invitations/${inv.id}/decline`}>
                      <button
                        type="submit"
                        class="cn-button-size-xs border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold font-heading">My organizations</h2>
          <Button variant="outline" size="xs" href="/orgs/new">
            <Icon name="plus" class="size-3" />
            Create Organization
          </Button>
        </div>
        {orgs.length === 0 ? (
          <div class="cn-card p-8 text-center">
            <Icon name="users-three" class="mx-auto mb-4 size-12 text-muted-foreground" />
            <p class="text-sm font-medium font-heading">No organizations yet</p>
            <p class="mx-auto mt-1.5 max-w-xs text-xs text-muted-foreground">
              Create an org to publish packages under a shared namespace and collaborate with your team.
            </p>
            <div class="mt-4">
              <Button variant="default" size="xs" href="/orgs/new">
                <Icon name="plus" class="size-3" />
                Create Organization
              </Button>
            </div>
          </div>
        ) : (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => (
              <a
                href={`/org/${encodeURIComponent(org.name)}`}
                class="cn-card block p-4 transition-all hover:ring-foreground/25"
              >
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-sm font-medium font-heading">{org.display_name || org.name}</span>
                  {org.role && <Badge variant="secondary">{org.role}</Badge>}
                </div>
                <p class="text-xs text-muted-foreground">@{org.name}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    )}

    {/* Notifications tab */}
    {activeTab === "notifications" && (
      <section>
        {/* Pending transfers */}
        {transfers.length > 0 && (
          <div class="mb-6">
            <h2 class="mb-3 text-sm font-semibold font-heading">
              Pending Transfers ({transfers.length})
            </h2>
            <div class="space-y-2">
              {transfers.map((t) => (
                <div class="cn-card flex items-center justify-between p-4">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">{t.package}</span>
                    <span class="text-xs text-muted-foreground">
                      {t.from} &rarr; {t.to}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <form method="post" action={`/transfers/${t.id}/accept`}>
                      <button
                        type="submit"
                        class="cn-button-size-xs bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Accept
                      </button>
                    </form>
                    <form method="post" action={`/transfers/${t.id}/decline`}>
                      <button
                        type="submit"
                        class="cn-button-size-xs border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications list */}
        <h2 class="mb-3 text-sm font-semibold font-heading">Notifications</h2>
        {notifications.length === 0 ? (
          <div class="cn-card p-8 text-center">
            <Icon name="bell" class="mx-auto mb-4 size-12 text-muted-foreground" />
            <p class="text-sm font-medium font-heading">All caught up</p>
            <p class="mt-1.5 text-xs text-muted-foreground">No notifications to show.</p>
          </div>
        ) : (
          <div class="space-y-2">
            {notifications.map((n) => (
              <div class={`cn-card flex items-center justify-between p-4 ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
                <div>
                  <p class={`text-sm ${!n.read ? "font-medium" : "text-muted-foreground"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p class="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  )}
                  <p class="mt-1 text-[10px] text-muted-foreground">{n.created_at}</p>
                </div>
                {!n.read && (
                  <form method="post" action={`/notifications/${n.id}/read`}>
                    <button
                      type="submit"
                      class="cn-button-size-xs border border-border bg-background px-3 text-xs text-muted-foreground hover:bg-muted"
                    >
                      Mark read
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    )}

    {/* Sync tab */}
    {activeTab === "sync" && (
      <section>
        <h2 class="mb-4 text-sm font-semibold font-heading">Sync profile</h2>
        <SyncPanel meta={syncMeta} />
      </section>
    )}
  </Container>
);
