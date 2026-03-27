import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { PackageCard } from "../components/package-card";

export const DashboardPage: FC<{
  username: string;
  packages: PackageSummary[];
}> = ({ username, packages }) => (
  <div class="mx-auto max-w-5xl px-4 py-8">
    <h1 class="mb-6 text-lg font-semibold">Dashboard</h1>
    <p class="mb-4 text-sm text-muted-foreground">Signed in as @{username}</p>

    <section class="mb-8">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-semibold">My packages</h2>
        <a href="/docs/publish" class="cn-button-outline text-[10px]">
          Publish a package →
        </a>
      </div>
      {packages.length === 0 ? (
        <div class="cn-card text-center">
          <p class="text-muted-foreground">No packages published yet.</p>
          <p class="mt-2">
            <code class="bg-muted px-2 py-1 font-mono text-[11px]">ctx publish</code>
          </p>
        </div>
      ) : (
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard pkg={pkg} />
          ))}
        </div>
      )}
    </section>
  </div>
);
