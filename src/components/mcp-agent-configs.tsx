import type { FC } from "hono/jsx";
import type { ManifestInfo } from "../lib/types";
/**
 * Tabbed component showing ready-to-paste MCP configuration JSON
 * for each supported agent (Claude, Cursor, VS Code, generic).
 */
export const MCPAgentConfigs: FC<{
  shortName: string;
  manifest: ManifestInfo;
}> = ({ shortName, manifest }) => {
  const mcp = manifest.mcp;
  if (!mcp) return null;

  const agents = buildAgentConfigs(shortName, mcp);

  return (
    <div class="mt-6">
      <h3 class="mb-3 text-sm font-semibold font-heading">Agent Configuration</h3>
      <div class="install-tabs" role="tablist" aria-label="Agent configuration">
        {agents.map((agent, i) => (
          <button
            role="tab"
            class="cn-install-tab"
            aria-selected={i === 0 ? "true" : "false"}
            data-tab={agent.id}
          >
            {agent.label}
          </button>
        ))}
      </div>
      {agents.map((agent, i) => (
        <div
          role="tabpanel"
          id={`panel-${agent.id}`}
          class={i === 0 ? "" : "hidden"}
          data-panel={agent.id}
        >
          <div class="relative">
            <pre class="overflow-x-auto border border-border bg-muted/50 p-4 text-xs font-mono leading-relaxed">
              <code>{agent.config}</code>
            </pre>
            <button
              class="absolute right-2 top-2 cn-badge cn-badge-variant-secondary text-xs cursor-pointer"
              data-copy={agent.config}
              title="Copy to clipboard"
            >
              Copy
            </button>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">{agent.hint}</p>
        </div>
      ))}
    </div>
  );
};

interface AgentConfig {
  id: string;
  label: string;
  config: string;
  hint: string;
}

function buildAgentConfigs(
  name: string,
  mcp: NonNullable<ManifestInfo["mcp"]>,
): AgentConfig[] {
  const configs: AgentConfig[] = [];

  // Build the server entry
  const entry: Record<string, unknown> = {};
  if (mcp.transport === "stdio" || !mcp.transport) {
    if (mcp.command) entry.command = mcp.command;
    if (mcp.args?.length) entry.args = mcp.args;
  }
  if (mcp.url) entry.url = mcp.url;
  if (mcp.env?.length) {
    const envObj: Record<string, string> = {};
    for (const e of mcp.env) {
      envObj[e.name] = e.default || `YOUR_${e.name}`;
    }
    entry.env = envObj;
  }

  // Claude / Cursor / Windsurf (same mcpServers format)
  const standardConfig = JSON.stringify({ mcpServers: { [name]: entry } }, null, 2);
  configs.push({
    id: "claude",
    label: "Claude",
    config: standardConfig,
    hint: "Add to ~/.claude/mcp.json or use: claude mcp add-json " + name,
  });
  configs.push({
    id: "cursor",
    label: "Cursor",
    config: standardConfig,
    hint: "Add to ~/.cursor/mcp.json",
  });

  // VS Code (uses mcp.servers key in settings)
  const vscodeEntry: Record<string, unknown> = { type: mcp.transport || "stdio", ...entry };
  const vscodeConfig = JSON.stringify({ "mcp.servers": { [name]: vscodeEntry } }, null, 2);
  configs.push({
    id: "vscode",
    label: "VS Code",
    config: vscodeConfig,
    hint: "Add to .vscode/settings.json or user settings",
  });

  // ctx (one-liner)
  configs.push({
    id: "ctx",
    label: "ctx",
    config: `ctx install @*/${name}`,
    hint: "Installs and auto-configures for all detected agents",
  });

  return configs;
}
