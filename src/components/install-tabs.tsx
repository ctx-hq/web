import type { FC } from "hono/jsx";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";

export const InstallTabs: FC<{ fullName: string }> = ({ fullName }) => (
  <div class="install-tabs cn-card">
    <div class="flex border-b border-border">
      <button
        data-tab="human"
        class="border-b-2 border-b-foreground px-3 py-1.5 text-xs font-medium"
      >
        Human
      </button>
      <button
        data-tab="agent"
        class="border-b-2 border-b-transparent px-3 py-1.5 text-xs font-medium text-muted-foreground"
      >
        Agent
      </button>
    </div>
    <div data-panel="human" class="p-3">
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
    <div data-panel="agent" class="hidden p-3">
      <p class="mb-2 text-xs text-muted-foreground">
        Paste this into your AI assistant:
      </p>
      <div class="flex items-center gap-2">
        <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
          Install the @{fullName} package using ctx
        </code>
        <Button
          variant="outline"
          size="xs"
          data-copy={`Install the @${fullName} package using ctx`}
        >
          <Icon name="copy" class="size-3" />
          Copy
        </Button>
      </div>
    </div>
  </div>
);
