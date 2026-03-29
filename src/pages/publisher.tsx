import type { FC } from "hono/jsx";
import type { PublisherProfile, PackageSummary } from "../lib/types";
import { Container } from "../components/ui/container";
import { Badge } from "../components/badge";
import { PackageCard } from "../components/package-card";

export const PublisherPage: FC<{
  publisher: PublisherProfile;
  packages: PackageSummary[];
}> = ({ publisher, packages }) => (
  <Container class="py-10">
    <div class="mb-6">
      <div class="mb-2 flex flex-wrap items-center gap-2">
        <h1 class="text-xl font-semibold font-heading">@{publisher.slug}</h1>
        <Badge variant="secondary">{publisher.kind}</Badge>
      </div>
      <p class="text-sm text-muted-foreground">
        {publisher.packages} {publisher.packages === 1 ? "package" : "packages"} published
      </p>
    </div>

    <section aria-label="Publisher packages">
      {packages.length === 0 ? (
        <div class="cn-card p-6 text-center">
          <p class="text-sm text-muted-foreground">No packages published yet.</p>
        </div>
      ) : (
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packages.map((pkg) => (
            <PackageCard key={pkg.full_name} pkg={pkg} />
          ))}
        </div>
      )}
    </section>
  </Container>
);
