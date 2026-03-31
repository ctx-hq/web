import type { FC } from "hono/jsx";
import { Icon } from "./ui/icon";

/**
 * Displays MCP server tools as a compact list with optional expand/collapse.
 */
export const MCPToolsList: FC<{ tools: string[] }> = ({ tools }) => {
  if (!tools.length) return null;

  const showAll = tools.length <= 6;
  const visible = showAll ? tools : tools.slice(0, 5);
  const hidden = showAll ? [] : tools.slice(5);

  return (
    <div>
      <h4 class="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tools ({tools.length})
      </h4>
      <ul class="space-y-1" role="list">
        {visible.map((tool) => (
          <li class="flex items-center gap-1.5 text-sm">
            <Icon name="wrench" class="size-3 shrink-0 text-muted-foreground" />
            <code class="text-xs font-mono">{tool}</code>
          </li>
        ))}
      </ul>
      {hidden.length > 0 && (
        <details class="mt-1">
          <summary class="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Show {hidden.length} more
          </summary>
          <ul class="mt-1 space-y-1" role="list">
            {hidden.map((tool) => (
              <li class="flex items-center gap-1.5 text-sm">
                <Icon name="wrench" class="size-3 shrink-0 text-muted-foreground" />
                <code class="text-xs font-mono">{tool}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
