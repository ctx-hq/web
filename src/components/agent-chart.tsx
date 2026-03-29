import type { FC } from "hono/jsx";
import { AGENT_DISPLAY_NAMES } from "../lib/constants";
import { formatNumber } from "../lib/format";

export const AgentChart: FC<{
  breakdown: { agent: string; count: number; percentage: number }[];
}> = ({ breakdown }) => {
  if (!breakdown || breakdown.length === 0) {
    return <p class="text-xs text-muted-foreground">No agent data available.</p>;
  }

  return (
    <div class="space-y-2" aria-label="Agent breakdown chart">
      {breakdown.map((entry) => (
        <div class="space-y-0.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium">
              {AGENT_DISPLAY_NAMES[entry.agent] ?? entry.agent}
            </span>
            <span class="text-muted-foreground">
              {formatNumber(entry.count)} ({entry.percentage.toFixed(1)}%)
            </span>
          </div>
          <div class="h-2 w-full rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-foreground/70"
              style={`width: ${Math.min(entry.percentage, 100)}%`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
