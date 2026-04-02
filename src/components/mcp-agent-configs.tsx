import type { FC } from "hono/jsx";
import type { ManifestInfo } from "../lib/types";
/**
 * Tabbed component showing ready-to-paste MCP configuration JSON
 * for each supported agent (Claude, Cursor, VS Code, generic).
 *
 * When the manifest declares multiple transports (mcp.transports[]),
 * a transport selector row appears above the agent tabs.
 */
export const MCPAgentConfigs: FC<{
  shortName: string;
  manifest: ManifestInfo;
}> = ({ shortName, manifest }) => {
  const mcp = manifest.mcp;
  if (!mcp) return null;

  const transports = buildTransportOptions(mcp);
  const hasMultiTransport = transports.length > 1;

  return (
    <div class="mt-6">
      <h3 class="mb-3 text-sm font-semibold font-heading">Agent Configuration</h3>

      {/* Transport selector (only shown when multiple transports available) */}
      {hasMultiTransport && (
        <div class="mb-3">
          <div class="install-tabs" role="tablist" aria-label="Transport selection">
            {transports.map((t, i) => (
              <button
                role="tab"
                class="cn-install-tab"
                aria-selected={i === 0 ? "true" : "false"}
                data-transport-tab={t.id}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Agent configs for each transport */}
      {transports.map((transport, ti) => {
        const agents = buildAgentConfigs(shortName, mcp, transport.id);
        return (
          <div
            data-transport-panel={transport.id}
            class={ti === 0 ? "" : "hidden"}
          >
            <div class="install-tabs" role="tablist" aria-label="Agent configuration">
              {agents.map((agent, i) => (
                <button
                  role="tab"
                  class="cn-install-tab"
                  aria-selected={i === 0 ? "true" : "false"}
                  data-tab={`${transport.id}-${agent.id}`}
                >
                  {agent.label}
                </button>
              ))}
            </div>
            {agents.map((agent, i) => (
              <div
                role="tabpanel"
                id={`panel-${transport.id}-${agent.id}`}
                class={i === 0 ? "" : "hidden"}
                data-panel={`${transport.id}-${agent.id}`}
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
      })}
    </div>
  );
};

interface TransportOption {
  id: string;
  label: string;
}

interface AgentConfig {
  id: string;
  label: string;
  config: string;
  hint: string;
}

/** Build transport options from the manifest. Always includes the default transport. */
export function buildTransportOptions(
  mcp: NonNullable<ManifestInfo["mcp"]>,
): TransportOption[] {
  const options: TransportOption[] = [
    {
      id: "default",
      label: mcp.transport === "stdio"
        ? `${mcp.command ?? "stdio"} (stdio)`
        : `${mcp.transport ?? "stdio"}`,
    },
  ];

  if (mcp.transports) {
    for (const t of mcp.transports) {
      options.push({
        id: t.id,
        label: t.label ?? `${t.id} (${t.transport})`,
      });
    }
  }

  return options;
}

/** Build agent-specific configuration JSON for a given transport. */
export function buildAgentConfigs(
  name: string,
  mcp: NonNullable<ManifestInfo["mcp"]>,
  transportId?: string,
): AgentConfig[] {
  const configs: AgentConfig[] = [];

  // Resolve the transport to use
  const { entry, envVars } = resolveTransport(mcp, transportId);

  // Add env to entry
  if (envVars && envVars.length > 0) {
    const envObj: Record<string, string> = {};
    for (const e of envVars) {
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

  // VS Code (uses mcp.servers key in settings with explicit type)
  const transport = resolveTransportType(mcp, transportId);
  const vscodeEntry: Record<string, unknown> = { type: transport, ...entry };
  const vscodeConfig = JSON.stringify({ "mcp.servers": { [name]: vscodeEntry } }, null, 2);
  configs.push({
    id: "vscode",
    label: "VS Code",
    config: vscodeConfig,
    hint: "Add to .vscode/settings.json or user settings",
  });

  // ctx (one-liner)
  let ctxCmd = `ctx install @*/${name}`;
  if (transportId && transportId !== "default") {
    ctxCmd += ` --transport=${transportId}`;
  }
  configs.push({
    id: "ctx",
    label: "ctx",
    config: ctxCmd,
    hint: "Installs and auto-configures for all detected agents",
  });

  return configs;
}

function buildTransportEntry(
  transport: string,
  source: { command?: string; args?: string[]; url?: string },
): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  if (transport === "stdio" || !transport) {
    if (source.command) entry.command = source.command;
    if (source.args?.length) entry.args = source.args;
  }
  if (source.url) entry.url = source.url;
  return entry;
}

function resolveTransport(
  mcp: NonNullable<ManifestInfo["mcp"]>,
  transportId?: string,
): { entry: Record<string, unknown>; envVars?: NonNullable<ManifestInfo["mcp"]>["env"] } {
  // Check transports[] for named transport
  if (transportId && transportId !== "default" && mcp.transports) {
    const t = mcp.transports.find((tr) => tr.id === transportId);
    if (t) {
      return { entry: buildTransportEntry(t.transport, t), envVars: t.env };
    }
  }

  // Default transport
  return { entry: buildTransportEntry(mcp.transport || "", mcp), envVars: mcp.env };
}

function resolveTransportType(
  mcp: NonNullable<ManifestInfo["mcp"]>,
  transportId?: string,
): string {
  if (transportId && transportId !== "default" && mcp.transports) {
    const t = mcp.transports.find((tr) => tr.id === transportId);
    if (t) return t.transport;
  }
  return mcp.transport || "stdio";
}
