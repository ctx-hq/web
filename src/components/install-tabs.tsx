import type { FC } from "hono/jsx";

export const InstallTabs: FC<{ fullName: string }> = ({ fullName }) => (
  <div class="install-tabs border border-border">
    <div class="flex border-b border-border">
      <button
        data-tab="human"
        class="border-b-2 border-b-foreground px-3 py-1.5 text-xs font-medium"
      >
        Human
      </button>
      <button
        data-tab="agent"
        class="px-3 py-1.5 text-xs font-medium text-muted-foreground"
      >
        Agent
      </button>
    </div>
    <div data-panel="human" class="p-3">
      <div class="flex items-center gap-2">
        <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
          ctx install @{fullName}
        </code>
        <button
          class="cn-button-outline px-2 py-1"
          data-copy={`ctx install @${fullName}`}
        >
          Copy
        </button>
      </div>
    </div>
    <div data-panel="agent" class="hidden p-3">
      <p class="mb-2 text-muted-foreground">
        Paste this into your AI assistant:
      </p>
      <div class="flex items-center gap-2">
        <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
          Install the @{fullName} package using ctx
        </code>
        <button
          class="cn-button-outline px-2 py-1"
          data-copy={`Install the @${fullName} package using ctx`}
        >
          Copy
        </button>
      </div>
    </div>
  </div>
);
