import type { FC } from "hono/jsx";
import type { PackageSummary, OrgInfo, OrgInvitation, SyncProfileMeta, TransferRequest, AppNotification, StarredPackage, StarList, ClaimablePackage, Claim } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { PackageCard } from "../components/package-card";
import { SyncPanel } from "../components/sync-panel";
import { Badge } from "../components/badge";

const TABS = [
  { key: "packages", label: "My Packages", href: "/dashboard" },
  { key: "stars", label: "Stars", href: "/dashboard?tab=stars" },
  { key: "orgs", label: "My Orgs", href: "/dashboard?tab=orgs" },
  { key: "notifications", label: "Notifications", href: "/dashboard?tab=notifications" },
  { key: "claims", label: "Claims", href: "/dashboard?tab=claims" },
  { key: "sync", label: "Sync", href: "/dashboard?tab=sync" },
] as const;

export const DashboardPage: FC<{
  username: string;
  packages: PackageSummary[];
  stars?: StarredPackage[];
  starLists?: StarList[];
  orgs?: OrgInfo[];
  invitations?: OrgInvitation[];
  transfers?: TransferRequest[];
  notifications?: AppNotification[];
  notificationCount?: number;
  claimablePackages?: ClaimablePackage[];
  claims?: Claim[];
  syncMeta?: SyncProfileMeta | null;
  activeTab?: string;
  activeListId?: string;
}> = ({ username, packages, stars = [], starLists = [], orgs = [], invitations = [], transfers = [], notifications = [], notificationCount = 0, claimablePackages = [], claims = [], syncMeta = null, activeTab = "packages", activeListId }) => (
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
            <span class="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
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
              <PackageCard key={pkg.full_name} pkg={pkg} showSettings />
            ))}
          </div>
        )}
      </section>
    )}

    {/* Stars tab */}
    {activeTab === "stars" && (
      <section>
        {/* Star Lists management */}
        <div class="mb-6">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold font-heading">Star Lists</h2>
          </div>
          {starLists.length > 0 && (
            <div class="mb-4 space-y-2">
              {starLists.map((list) => (
                <div class="cn-card flex items-center justify-between p-4" key={list.id}>
                  <div>
                    <span class="text-sm font-medium">{list.name}</span>
                    {list.description && (
                      <p class="mt-0.5 text-xs text-muted-foreground">{list.description}</p>
                    )}
                    <span class="text-xs text-muted-foreground">
                      {list.star_count} {list.star_count === 1 ? "package" : "packages"}
                    </span>
                  </div>
                  <form method="post" action={`/stars/lists/${list.id}/delete`} onsubmit={`return confirm('Delete list "${list.name}"?')`}>
                    <button
                      type="submit"
                      class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-destructive"
                      title={`Delete list "${list.name}"`}
                      aria-label={`Delete star list ${list.name}`}
                    >
                      <Icon name="trash" class="size-3.5" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
          <form method="post" action="/stars/lists/create" class="flex items-end gap-2">
            <div class="flex-1">
              <label for="list-name" class="mb-1 block text-xs text-muted-foreground">New list</label>
              <input
                type="text"
                id="list-name"
                name="name"
                required
                placeholder="e.g. Favorites, Work tools..."
                class="cn-input w-full"
              />
            </div>
            <button type="submit" class="cn-button cn-button-variant-outline cn-button-size-default">
              Create
            </button>
          </form>
        </div>

        {/* Star list filter + Starred packages */}
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-semibold font-heading">Starred packages</h2>
          {starLists.length > 0 && (
            <nav class="flex gap-1 text-xs" aria-label="Filter by list">
              <a
                href="/dashboard?tab=stars"
                class={`px-2 py-1 transition-colors ${!activeListId ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground border border-border"}`}
              >
                All
              </a>
              {starLists.map((list) => (
                <a
                  key={list.id}
                  href={`/dashboard?tab=stars&list=${encodeURIComponent(list.id)}`}
                  class={`px-2 py-1 transition-colors ${activeListId === list.id ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground border border-border"}`}
                >
                  {list.name}
                </a>
              ))}
            </nav>
          )}
        </div>
        {stars.length === 0 ? (
          <div class="cn-card p-8 text-center">
            <Icon name="star" class="mx-auto mb-4 size-12 text-muted-foreground" />
            <p class="text-sm font-medium font-heading">No starred packages</p>
            <p class="mx-auto mt-1.5 max-w-xs text-xs text-muted-foreground">
              Star packages you find useful to quickly find them later.
            </p>
            <div class="mt-4">
              <Button variant="outline" size="xs" href="/search">
                Browse packages
              </Button>
            </div>
          </div>
        ) : (
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stars.map((s) => (
              <a
                href={`/package/${s.full_name}`}
                class="cn-card block transition-all hover:ring-foreground/25"
              >
                <div class="p-5">
                  <div class="mb-1 flex items-center justify-between gap-1">
                    <span class="min-w-0 truncate text-sm font-medium font-heading">{s.full_name}</span>
                    <Badge type={s.type as any} />
                  </div>
                  <p class="mb-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  <span class="text-xs text-muted-foreground">
                    Starred {s.starred_at}
                  </span>
                </div>
              </a>
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
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold font-heading">Notifications</h2>
          {notifications.some((n) => !n.read) && (
            <form method="post" action="/notifications/mark-all-read">
              <button
                type="submit"
                class="cn-button cn-button-variant-outline cn-button-size-xs"
              >
                Mark all read
              </button>
            </form>
          )}
        </div>
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
                  <p class="mt-1 text-xs text-muted-foreground">{n.created_at}</p>
                </div>
                <div class="flex items-center gap-2">
                  {!n.read && (
                    <form method="post" action={`/notifications/${n.id}/read`}>
                      <button
                        type="submit"
                        class="cn-button cn-button-variant-ghost cn-button-size-xs"
                        title="Mark as read"
                      >
                        Mark read
                      </button>
                    </form>
                  )}
                  <form method="post" action={`/notifications/${n.id}/dismiss`}>
                    <button
                      type="submit"
                      class="cn-button cn-button-variant-ghost cn-button-size-icon-xs text-muted-foreground hover:text-foreground"
                      title="Dismiss"
                      aria-label={`Dismiss notification: ${n.title}`}
                    >
                      <Icon name="x" class="size-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    )}

    {/* Claims tab */}
    {activeTab === "claims" && (
      <section>
        {/* Claimable packages */}
        {claimablePackages.length > 0 && (
          <div class="mb-6">
            <h2 class="mb-3 text-sm font-semibold font-heading">
              Claimable Packages ({claimablePackages.length})
            </h2>
            <p class="mb-3 text-xs text-muted-foreground">
              These system-owned packages match your GitHub repos. Claim them to move them under your account.
            </p>
            <div class="space-y-2">
              {claimablePackages.map((pkg) => (
                <div class="cn-card flex items-center justify-between p-4" key={pkg.package_id}>
                  <div>
                    <span class="text-sm font-medium">{pkg.full_name}</span>
                    <p class="mt-0.5 text-xs text-muted-foreground">{pkg.description}</p>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      Source: {pkg.source_repo} &middot; {pkg.downloads} downloads
                    </p>
                  </div>
                  <form method="post" action="/claims">
                    <input type="hidden" name="package_id" value={pkg.package_id} />
                    <button
                      type="submit"
                      class="cn-button cn-button-variant-default cn-button-size-xs"
                    >
                      Claim
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claim history */}
        <h2 class="mb-3 text-sm font-semibold font-heading">Claim History</h2>
        {claims.length === 0 && claimablePackages.length === 0 ? (
          <div class="cn-card p-8 text-center">
            <Icon name="package" class="mx-auto mb-4 size-12 text-muted-foreground" />
            <p class="text-sm font-medium font-heading">No claims</p>
            <p class="mx-auto mt-1.5 max-w-xs text-xs text-muted-foreground">
              When system-owned packages match your GitHub repos, you can claim them here.
            </p>
          </div>
        ) : claims.length === 0 ? (
          <p class="text-sm text-muted-foreground">No claims yet.</p>
        ) : (
          <div class="space-y-2">
            {claims.map((claim) => (
              <div class="cn-card flex items-center justify-between p-4" key={claim.id}>
                <div>
                  <span class="text-sm font-medium">{claim.full_name || claim.package_id}</span>
                  <p class="mt-0.5 text-xs text-muted-foreground">{claim.created_at}</p>
                </div>
                <Badge variant={claim.status === "approved" ? "default" : claim.status === "rejected" ? "destructive" : "secondary"}>
                  {claim.status}
                </Badge>
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
