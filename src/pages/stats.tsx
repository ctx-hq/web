import type { FC } from "hono/jsx";
import type { AgentRanking, PackageSummary, RegistryOverview } from "../lib/types";
import { Container } from "../components/ui/container";
import { PackageCard } from "../components/package-card";
import { Icon } from "../components/ui/icon";
import { formatNumber, formatDownloads } from "../lib/format";
import { AGENT_DISPLAY_NAMES } from "../lib/constants";

export const StatsPage: FC<{
  overview: RegistryOverview | null;
  agents: AgentRanking[];
  trending: PackageSummary[];
}> = ({ overview, agents, trending }) => (
  <Container class="py-10">
    <h1 class="mb-8 text-xl font-semibold font-heading">Registry Stats</h1>

    {/* Registry Overview */}
    <section class="mb-8" aria-label="Registry overview">
      <h2 class="mb-4 text-sm font-semibold font-heading">Registry Overview</h2>
      {overview ? (
        <>
          <dl class="mb-4 grid gap-4 sm:grid-cols-3">
            <div class="cn-card p-4">
              <dt class="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="package" class="size-3" />
                Packages
              </dt>
              <dd class="text-lg font-semibold font-heading">
                {formatNumber(overview.total_packages)}
              </dd>
            </div>
            <div class="cn-card p-4">
              <dt class="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="download" class="size-3" />
                Downloads
              </dt>
              <dd class="text-lg font-semibold font-heading">
                {formatDownloads(overview.total_downloads)}
              </dd>
            </div>
            <div class="cn-card p-4">
              <dt class="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="user" class="size-3" />
                Publishers
              </dt>
              <dd class="text-lg font-semibold font-heading">
                {formatNumber(overview.total_publishers)}
              </dd>
            </div>
          </dl>

          {/* Type breakdown */}
          {overview.breakdown.length > 0 && (
            <div class="cn-card p-4" aria-label="Package type breakdown">
              <div class="space-y-2">
                {(() => {
                  const maxPct = Math.max(...overview.breakdown.map((e) => e.percentage), 1);
                  return overview.breakdown.map((entry) => {
                    const barWidth = (entry.percentage / maxPct) * 100;
                    return (
                      <div key={entry.type} class="space-y-0.5">
                      <div class="flex items-center justify-between text-xs">
                        <span class="font-medium">{entry.type}</span>
                        <span class="text-muted-foreground">
                          {formatNumber(entry.count)} ({entry.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div class="h-2 w-full bg-muted">
                        <div
                          class="h-2 bg-foreground/70"
                          style={`width: ${Math.min(barWidth, 100)}%`}
                          role="meter"
                          aria-valuenow={entry.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${entry.type}: ${entry.percentage.toFixed(1)} percent`}
                        />
                      </div>
                    </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </>
      ) : (
        <p class="text-sm text-muted-foreground">
          Registry overview data is not available at this time.
        </p>
      )}
    </section>

    {/* Agent Rankings */}
    <section class="mb-8" aria-label="Agent rankings">
      <h2 class="mb-4 text-sm font-semibold font-heading">Agent Rankings</h2>
      {agents.length === 0 ? (
        <p class="text-sm text-muted-foreground">No agent data available.</p>
      ) : (
        <div class="cn-card overflow-hidden">
          <table class="w-full text-sm" aria-label="Agent install rankings">
            <thead>
              <tr class="border-b border-border bg-muted/50">
                <th scope="col" class="px-4 py-2 text-left font-medium text-muted-foreground">#</th>
                <th scope="col" class="px-4 py-2 text-left font-medium text-muted-foreground">Agent</th>
                <th scope="col" class="px-4 py-2 text-right font-medium text-muted-foreground">Installs</th>
                <th scope="col" class="px-4 py-2 text-right font-medium text-muted-foreground">Packages</th>
                <th scope="col" class="hidden px-4 py-2 sm:table-cell">
                  <span class="sr-only">Relative volume</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const maxInstalls = Math.max(...agents.map((a) => a.total_installs), 1);
                return agents.map((agent, idx) => {
                  const barPct = (agent.total_installs / maxInstalls) * 100;
                  return (
                    <tr key={agent.name} class="border-b border-border last:border-0">
                      <td class="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                      <td class="px-4 py-2 font-medium">
                        {AGENT_DISPLAY_NAMES[agent.name] ?? agent.name}
                      </td>
                      <td class="px-4 py-2 text-right">{formatNumber(agent.total_installs)}</td>
                      <td class="px-4 py-2 text-right">{formatNumber(agent.packages)}</td>
                      <td class="hidden px-4 py-2 sm:table-cell">
                        <div class="h-2 w-full bg-muted">
                          <div
                            class="h-2 bg-foreground/70"
                            style={`width: ${barPct}%`}
                            role="meter"
                            aria-valuenow={agent.total_installs}
                            aria-valuemin={0}
                            aria-valuemax={maxInstalls}
                            aria-label={`${AGENT_DISPLAY_NAMES[agent.name] ?? agent.name}: ${formatNumber(agent.total_installs)} installs`}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
    </section>

    {/* Trending Packages */}
    <section aria-label="Trending packages">
      <h2 class="mb-4 text-sm font-semibold font-heading">Trending Packages</h2>
      {trending.length === 0 ? (
        <p class="text-sm text-muted-foreground">No trending data available.</p>
      ) : (
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {trending.map((pkg) => (
            <PackageCard key={pkg.full_name} pkg={pkg} />
          ))}
        </div>
      )}
    </section>
  </Container>
);
