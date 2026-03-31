import type { FC } from "hono/jsx";
import { Badge } from "./badge";

interface EnvVarEntry {
  name: string;
  required?: boolean;
  default?: string;
  description?: string;
}

/**
 * Displays required environment variables for an MCP server.
 */
export const MCPEnvVars: FC<{ vars: EnvVarEntry[] }> = ({ vars }) => {
  if (!vars.length) return null;

  return (
    <div>
      <h4 class="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Environment Variables
      </h4>
      <div class="space-y-2">
        {vars.map((v) => (
          <div class="border border-border p-2.5">
            <div class="flex items-center gap-2">
              <code class="text-xs font-mono font-medium">{v.name}</code>
              {v.required && (
                <Badge variant="destructive" class="text-xs">required</Badge>
              )}
            </div>
            {v.description && (
              <p class="mt-1 text-xs text-muted-foreground">{v.description}</p>
            )}
            {v.default && (
              <p class="mt-0.5 text-xs text-muted-foreground">
                Default: <code class="font-mono">{v.default}</code>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
