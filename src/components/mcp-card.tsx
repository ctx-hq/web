import type { FC } from "hono/jsx";
import type { MCPHubEntry } from "../lib/types";
import { formatDownloads } from "../lib/format";
import { MCP_TRANSPORT_LABELS } from "../lib/constants";
import { Badge } from "./badge";
import { Icon } from "./ui/icon";

export const MCPCard: FC<{ server: MCPHubEntry }> = ({ server }) => (
  <a
    href={`/package/${server.full_name}`}
    class="cn-card block transition-all hover:ring-foreground/25"
  >
    <article class="p-5">
      <div class="mb-1 flex items-center justify-between gap-1">
        <h3 class="min-w-0 truncate text-sm font-medium font-heading">
          {server.full_name}
        </h3>
        <div class="flex shrink-0 items-center gap-1.5">
          <span class="cn-badge cn-badge-variant-outline text-xs">
            {MCP_TRANSPORT_LABELS[server.transport] ?? server.transport}
          </span>
          <Badge type="mcp" />
        </div>
      </div>
      {server.publisher_slug && (
        <div class="mb-1">
          <span class="text-xs text-muted-foreground">@{server.publisher_slug}</span>
        </div>
      )}
      <p class="mb-2 line-clamp-2 text-sm text-muted-foreground">
        {server.description}
      </p>
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        {server.version && <span>v{server.version}</span>}
        {server.tools_count > 0 && (
          <span class="inline-flex items-center gap-0.5">
            <Icon name="wrench" class="size-3" />
            {server.tools_count} tools
          </span>
        )}
        <span class="inline-flex items-center gap-0.5">
          <Icon name="download" class="size-3" />
          {formatDownloads(server.downloads)}
        </span>
      </div>
    </article>
  </a>
);
