import type { FC } from "hono/jsx";
import type { PackageSummary } from "../lib/types";
import { SITE_TAGLINE, SITE_DESCRIPTION } from "../lib/constants";
import { SearchBox } from "../components/search-box";
import { PackageCard } from "../components/package-card";

export const HomePage: FC<{ trending: PackageSummary[] }> = ({ trending }) => (
  <div class="mx-auto max-w-5xl px-4">
    {/* Hero */}
    <section class="py-16 text-center">
      <h1 class="mb-3 text-2xl font-semibold tracking-tight">{SITE_TAGLINE}</h1>
      <p class="mx-auto mb-8 max-w-lg text-sm text-muted-foreground">
        {SITE_DESCRIPTION}
      </p>
      <div class="mx-auto max-w-md">
        <SearchBox size="large" autofocus />
      </div>
    </section>

    {/* Install guide */}
    <section class="mb-12 grid gap-4 md:grid-cols-2">
      <div class="cn-card">
        <h2 class="mb-2 text-sm font-semibold">Install ctx</h2>
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-muted px-2 py-1 font-mono text-[11px]">
            curl -fsSL https://getctx.org/install.sh | sh
          </code>
          <button
            class="cn-button-outline px-2 py-1 text-[10px]"
            data-copy="curl -fsSL https://getctx.org/install.sh | sh"
          >
            Copy
          </button>
        </div>
      </div>
      <div class="cn-card">
        <h2 class="mb-2 text-sm font-semibold">Then use it</h2>
        <code class="block bg-muted px-2 py-1 font-mono text-[11px] leading-relaxed">
          ctx search "code review"
          <br />
          ctx install @scope/name
          <br />
          ctx serve
        </code>
      </div>
    </section>

    {/* Type filters */}
    <section class="mb-8 flex gap-2">
      <a href="/search?type=skill" class="cn-badge bg-type-skill-bg text-type-skill border-type-skill/20">
        skill
      </a>
      <a href="/search?type=mcp" class="cn-badge bg-type-mcp-bg text-type-mcp border-type-mcp/20">
        mcp
      </a>
      <a href="/search?type=cli" class="cn-badge bg-type-cli-bg text-type-cli border-type-cli/20">
        cli
      </a>
    </section>

    {/* Trending */}
    {trending.length > 0 && (
      <section class="mb-16">
        <h2 class="mb-4 text-sm font-semibold">Trending</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((pkg) => (
            <PackageCard pkg={pkg} />
          ))}
        </div>
      </section>
    )}
  </div>
);
