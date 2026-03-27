import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { PackageCard } from "../components/package-card";

export const DashboardPage: FC<{
  username: string;
  packages: PackageSummary[];
}> = ({ username, packages }) => (
  <Container class="py-8">
    <h1 class="mb-6 text-base font-semibold font-heading">Dashboard</h1>
    <p class="mb-4 text-xs text-muted-foreground">Signed in as @{username}</p>

    <section class="mb-8">
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
  </Container>
);
