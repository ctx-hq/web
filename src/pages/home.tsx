import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { SITE_TAGLINE, SITE_DESCRIPTION, PACKAGE_TYPES, PLACEHOLDER_BY_TYPE } from "../lib/constants";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { SearchBox } from "../components/search-box";
import { PackageCard } from "../components/package-card";
import { Badge } from "../components/badge";
import { GetStarted } from "../components/get-started";

export const HomePage: FC<{ trending: PackageSummary[]; apiError?: boolean }> = ({ trending, apiError }) => (
  <Container>
    {/* Hero */}
    <section class="py-20 text-center">
      <div class="mb-5">
        <Icon name="package" class="mx-auto size-16 text-muted-foreground" />
      </div>
      <h1 class="mb-3 text-2xl font-bold font-heading tracking-tight sm:text-3xl">
        {SITE_TAGLINE}
      </h1>
      <p class="mx-auto mb-10 max-w-lg text-sm text-muted-foreground">
        {SITE_DESCRIPTION}
      </p>
      <div class="mx-auto max-w-lg">
        {/* Fused tab-input control */}
        <div class="cn-tabbed-input">
          <nav
            class="flex"
            aria-label="Package type filter"
          >
            <a
              href="/search"
              class="cn-tabbed-input-tab cn-tabbed-input-tab-active"
              data-home-tab=""
              data-placeholder={PLACEHOLDER_BY_TYPE[""]}
              aria-current="true"
            >
              All
            </a>
            {PACKAGE_TYPES.map((t) => (
              <a
                href={`/search?type=${t}`}
                class="cn-tabbed-input-tab"
                data-home-tab={t}
                data-placeholder={PLACEHOLDER_BY_TYPE[t]}
                aria-current="false"
              >
                {t}
              </a>
            ))}
          </nav>
          <SearchBox size="large" autofocus />
        </div>
      </div>
    </section>

    {/* Get Started */}
    <GetStarted />

    {/* Trending or empty state */}
    <section class="mb-16">
      <h2 class="mb-4 text-xs font-semibold font-heading">Trending</h2>
      {trending.length > 0 ? (
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((pkg) => (
            <PackageCard key={pkg.full_name} pkg={pkg} />
          ))}
        </div>
      ) : apiError ? (
        <div class="cn-card p-12 text-center">
          <p class="mb-2 text-sm text-muted-foreground">Service temporarily unavailable</p>
          <p class="text-xs text-muted-foreground">
            Please try again later.
          </p>
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
