import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { SITE_TAGLINE, SITE_DESCRIPTION } from "../lib/constants";
import { Container } from "../components/ui/container";
import { Button } from "../components/ui/button";
import { Icon } from "../components/ui/icon";
import { SearchBox } from "../components/search-box";
import { PackageCard } from "../components/package-card";
import { Badge } from "../components/badge";

export const HomePage: FC<{ trending: PackageSummary[] }> = ({ trending }) => (
  <Container>
    {/* Hero */}
    <section class="py-20 text-center">
      <div class="mb-5">
        <Icon name="package" class="mx-auto size-10 text-muted-foreground" />
      </div>
      <h1 class="mb-3 text-2xl font-bold font-heading tracking-tight sm:text-3xl">
        {SITE_TAGLINE}
      </h1>
      <p class="mx-auto mb-10 max-w-lg text-sm text-muted-foreground">
        {SITE_DESCRIPTION}
      </p>
      <div class="mx-auto max-w-lg">
        <SearchBox size="large" autofocus />
      </div>
    </section>

    {/* Install guide */}
    <section class="mb-12 grid gap-4 md:grid-cols-2">
      <div class="cn-card flex flex-col justify-between p-4">
        <h2 class="mb-3 text-xs font-semibold font-heading">Install ctx</h2>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-muted px-3 py-2 font-mono text-xs">
            curl -fsSL https://getctx.org/install.sh | sh
          </code>
          <Button
            variant="outline"
            size="xs"
            data-copy="curl -fsSL https://getctx.org/install.sh | sh"
          >
            <Icon name="copy" class="size-3" />
            Copy
          </Button>
        </div>
      </div>
      <div class="cn-card flex flex-col justify-between p-4">
        <h2 class="mb-3 text-xs font-semibold font-heading">Then use it</h2>
        <code class="block bg-muted px-3 py-2 font-mono text-xs leading-relaxed">
          ctx search "code review"
          <br />
          ctx install @scope/name
          <br />
          ctx serve
        </code>
      </div>
    </section>

    {/* Browse by type */}
    <section class="mb-12">
      <h2 class="mb-3 text-xs font-medium font-heading uppercase tracking-wider text-muted-foreground">
        Browse by type
      </h2>
      <div class="flex gap-2">
        <Badge type="skill" href="/search?type=skill" class="px-3 py-1" />
        <Badge type="mcp" href="/search?type=mcp" class="px-3 py-1" />
        <Badge type="cli" href="/search?type=cli" class="px-3 py-1" />
      </div>
    </section>

    {/* Trending or empty state */}
    <section class="mb-16">
      <h2 class="mb-4 text-xs font-semibold font-heading">Trending</h2>
      {trending.length > 0 ? (
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((pkg) => (
            <PackageCard key={pkg.full_name} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div class="cn-card p-12 text-center">
          <p class="mb-2 text-sm text-muted-foreground">No packages yet</p>
          <p class="text-xs text-muted-foreground">
            Be the first to publish:&nbsp;
            <code class="bg-muted px-2 py-0.5 font-mono text-xs">ctx publish</code>
          </p>
        </div>
      )}
    </section>
  </Container>
);
