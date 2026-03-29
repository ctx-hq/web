import type { FC } from "hono/jsx";
import type { PackageStats } from "../lib/types";
import { Container } from "../components/ui/container";
import { Icon } from "../components/ui/icon";
import { AgentChart } from "../components/agent-chart";
import { formatNumber } from "../lib/format";

export const PackageStatsPage: FC<{
  fullName: string;
  stats: PackageStats;
}> = ({ fullName, stats }) => (
  <Container class="py-10">
    {/* Back navigation */}
    <a
      href={`/@${fullName}`}
      class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <Icon name="arrow-right" class="size-3 rotate-180" />
      Back to {fullName}
    </a>

    <h1 class="mb-6 text-xl font-semibold font-heading">{fullName} &mdash; Stats</h1>

    {/* Summary cards */}
    <div class="mb-8 grid gap-4 sm:grid-cols-3">
      <div class="cn-card p-4">
        <dt class="mb-1 text-xs text-muted-foreground">Total Downloads</dt>
        <dd class="text-lg font-semibold font-heading">{formatNumber(stats.downloads.total)}</dd>
      </div>
      <div class="cn-card p-4">
        <dt class="mb-1 text-xs text-muted-foreground">Weekly Downloads</dt>
        <dd class="text-lg font-semibold font-heading">{formatNumber(stats.downloads.weekly)}</dd>
      </div>
      <div class="cn-card p-4">
        <dt class="mb-1 text-xs text-muted-foreground">Agent Installs</dt>
        <dd class="text-lg font-semibold font-heading">{formatNumber(stats.agents.total_installs)}</dd>
      </div>
    </div>

    <div class="lg:flex lg:gap-8">
      {/* Daily downloads chart */}
      <section class="min-w-0 flex-1 mb-8 lg:mb-0">
        <h2 class="mb-4 text-sm font-semibold font-heading">Daily Downloads</h2>
        {stats.downloads.daily.length === 0 ? (
          <p class="text-sm text-muted-foreground">No daily data available.</p>
        ) : (
          <div class="cn-card p-4">
            <div class="flex items-end gap-px" style="height: 120px" aria-label="Daily download chart">
              {(() => {
                const maxCount = Math.max(...stats.downloads.daily.map((d) => d.count), 1);
                return stats.downloads.daily.map((day) => {
                  const heightPct = (day.count / maxCount) * 100;
                  return (
                    <div
                      class="flex-1 bg-foreground/70 transition-all hover:bg-foreground"
                      style={`height: ${Math.max(heightPct, 2)}%`}
                      title={`${day.date}: ${formatNumber(day.count)}`}
                    />
                  );
                });
              })()}
            </div>
            <div class="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>{stats.downloads.daily[0]?.date ?? ""}</span>
              <span>{stats.downloads.daily[stats.downloads.daily.length - 1]?.date ?? ""}</span>
            </div>
          </div>
        )}
      </section>

      {/* Agent breakdown */}
      <aside class="w-full lg:w-80 lg:shrink-0">
        <h2 class="mb-4 text-sm font-semibold font-heading">Agent Breakdown</h2>
        <div class="cn-card p-4">
          <AgentChart breakdown={stats.agents.breakdown} />
        </div>
      </aside>
    </div>
  </Container>
);
