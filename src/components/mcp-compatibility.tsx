import type { FC } from "hono/jsx";
import { AGENT_DISPLAY_NAMES, MCP_TRANSPORT_LABELS } from "../lib/constants";
import { Icon } from "./ui/icon";

// Agents that support remote MCP (HTTP/SSE) connections
const HTTP_CAPABLE_AGENTS = new Set([
  "claude", "cursor", "windsurf", "copilot", "vscode", "cline", "continue",
]);

// All agents that support stdio MCP
const ALL_AGENTS = Object.keys(AGENT_DISPLAY_NAMES);

/**
 * Shows which AI agents are compatible with this MCP server's transport.
 */
export const MCPCompatibility: FC<{ transport: string }> = ({ transport }) => {
  const isStdio = !transport || transport === "stdio";
  const agents = isStdio
    ? ALL_AGENTS
    : ALL_AGENTS.filter((a) => HTTP_CAPABLE_AGENTS.has(a));

  return (
    <div>
      <h4 class="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Compatible Agents ({MCP_TRANSPORT_LABELS[transport] ?? transport})
      </h4>
      <div class="flex flex-wrap gap-1.5">
        {agents.map((agent) => (
          <span class="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-xs">
            <Icon name="check" class="size-3 text-success" />
            {AGENT_DISPLAY_NAMES[agent] ?? agent}
          </span>
        ))}
        {!isStdio && ALL_AGENTS.filter((a) => !HTTP_CAPABLE_AGENTS.has(a)).map((agent) => (
          <span class="inline-flex items-center gap-1 border border-border px-2 py-0.5 text-xs opacity-40">
            <Icon name="x" class="size-3" />
            {AGENT_DISPLAY_NAMES[agent] ?? agent}
          </span>
        ))}
      </div>
    </div>
  );
};
