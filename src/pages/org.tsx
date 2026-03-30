import type { FC } from "hono/jsx";
import type { OrgDetail, OrgMember, PackageSummary } from "../lib/types";
import { Container } from "../components/ui/container";
import { PackageCard } from "../components/package-card";
import { OrgMembers } from "../components/org-members";

export const OrgPage: FC<{
  org: OrgDetail;
  members: OrgMember[] | null;
  packages: PackageSummary[];
  userRole?: string | null;
}> = ({ org, members, packages, userRole }) => (
  <Container class="py-10">
    <div class="mb-6">
      <h1 class="mb-1 text-xl font-semibold font-heading">
        {org.display_name || org.name}
      </h1>
      <p class="text-sm text-muted-foreground">@{org.name}</p>
      <div class="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span>{org.members} {org.members === 1 ? "member" : "members"}</span>
        <span>{org.packages} {org.packages === 1 ? "package" : "packages"}</span>
        {(userRole === "owner" || userRole === "admin") && (
          <a
            href={`/org/${org.name}/settings`}
            class="cn-button-size-xs border border-border bg-background px-2 text-xs font-medium hover:bg-muted"
          >
            Settings
          </a>
        )}
      </div>
    </div>

    <div class="lg:flex lg:gap-8">
      {/* Main content — packages */}
      <div class="min-w-0 flex-1">
        <section aria-label="Organization packages">
          <h2 class="mb-4 text-sm font-semibold font-heading">Packages</h2>
          {packages.length === 0 ? (
            <div class="cn-card p-6 text-center">
              <p class="text-sm text-muted-foreground">No packages published yet.</p>
            </div>
          ) : (
            <div class="grid gap-4 sm:grid-cols-2">
              {packages.map((pkg) => (
                <PackageCard key={pkg.full_name} pkg={pkg} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sidebar — members */}
      <aside class="mt-8 w-full lg:mt-0 lg:w-80 lg:shrink-0">
        <div class="cn-card p-5">
          <h3 class="mb-3 text-sm font-semibold font-heading">Members</h3>
          <OrgMembers members={members} />
        </div>
      </aside>
    </div>
  </Container>
);
