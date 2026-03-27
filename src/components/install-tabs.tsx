import type { FC } from "hono/jsx";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { agentPromptPackage } from "../lib/get-started";

export const InstallTabs: FC<{ fullName: string }> = ({ fullName }) => {
  const agentCmd = agentPromptPackage(fullName);

  return (
    <div class="install-tabs cn-card">
      <div class="flex border-b border-border">
        <button
          data-tab="agent"
          class="border-b-2 border-b-foreground px-3 py-1.5 text-xs font-medium"
        >
          Agent
        </button>
        <button
          data-tab="human"
          class="border-b-2 border-b-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground"
        >
          Human
        </button>
      </div>
      <div data-panel="agent" class="p-3">
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
            {agentCmd}
          </code>
          <Button variant="outline" size="xs" data-copy={agentCmd}>
            <Icon name="copy" class="size-3" />
            Copy
          </Button>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          Send this to your Agent to use @{fullName}
        </p>
      </div>
      <div data-panel="human" class="hidden p-3">
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
            ctx install @{fullName}
          </code>
          <Button
            variant="outline"
            size="xs"
            data-copy={`ctx install @${fullName}`}
          >
            <Icon name="copy" class="size-3" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  );
};
