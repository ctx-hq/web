import type { FC } from "hono/jsx";
import type { AgentRanking, PackageSummary } from "../lib/types";
import { Container } from "../components/ui/container";
import { PackageCard } from "../components/package-card";
import { formatNumber } from "../lib/format";
import { AGENT_DISPLAY_NAMES } from "../lib/constants";

export const StatsPage: FC<{
  agents: AgentRanking[];
  trending: PackageSummary[];
}> = ({ agents, trending }) => (
  <Container class="py-8">
    <h1 class="mb-6 text-base font-semibold font-heading">Registry Stats</h1>

    {/* Agent Rankings */}
    <section class="mb-8" aria-label="Agent rankings">
      <h2 class="mb-4 text-xs font-semibold font-heading">Agent Rankings</h2>
      {agents.length === 0 ? (
        <p class="text-xs text-muted-foreground">No agent data available.</p>
      ) : (
        <div class="cn-card overflow-hidden">
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-border bg-muted/50">
                <th class="px-4 py-2 text-left font-medium text-muted-foreground">#</th>
                <th class="px-4 py-2 text-left font-medium text-muted-foreground">Agent</th>
                <th class="px-4 py-2 text-right font-medium text-muted-foreground">Installs</th>
                <th class="px-4 py-2 text-right font-medium text-muted-foreground">Packages</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, idx) => (
                <tr class="border-b border-border last:border-0">
                  <td class="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                  <td class="px-4 py-2 font-medium">
                    {AGENT_DISPLAY_NAMES[agent.name] ?? agent.name}
                  </td>
                  <td class="px-4 py-2 text-right">{formatNumber(agent.total_installs)}</td>
                  <td class="px-4 py-2 text-right">{formatNumber(agent.packages)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>

    {/* Trending Packages */}
    <section aria-label="Trending packages">
      <h2 class="mb-4 text-xs font-semibold font-heading">Trending Packages</h2>
      {trending.length === 0 ? (
        <p class="text-xs text-muted-foreground">No trending data available.</p>
      ) : (
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trending.map((pkg) => (
            <PackageCard key={pkg.full_name} pkg={pkg} />
          ))}
        </div>
      )}
    </section>
  </Container>
);
