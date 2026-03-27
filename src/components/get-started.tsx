import type { FC } from "hono/jsx";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import {
  agentPromptGlobal,
  installCommandUnix,
  installCommandWindows,
  usageExamples,
} from "../lib/get-started";

export const GetStarted: FC = () => {
  const agentCmd = agentPromptGlobal();
  const unixCmd = installCommandUnix();
  const winCmd = installCommandWindows();
  const examples = usageExamples();

  return (
    <section class="mb-12">
      <div class="install-tabs cn-card">
        {/* Tab bar — Agent default */}
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

        {/* Agent panel (visible by default) */}
        <div data-panel="agent" class="p-4">
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-muted px-3 py-2 font-mono text-xs">
              {agentCmd}
            </code>
            <Button variant="outline" size="xs" data-copy={agentCmd}>
              <Icon name="copy" class="size-3" />
              Copy
            </Button>
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            Send this to your Agent to get started with ctx
          </p>
        </div>

        {/* Human panel (hidden by default) */}
        <div data-panel="human" class="hidden p-4">
          {/* OS toggle */}
          <div class="os-toggle mb-3 flex gap-3 text-xs" data-os-container>
            <button
              data-os-toggle="unix"
              class="font-medium"
            >
              macOS / Linux
            </button>
            <button
              data-os-toggle="windows"
              class="text-muted-foreground"
            >
              Windows
            </button>
          </div>

          {/* Unix install */}
          <div data-os-panel="unix">
            <div class="flex items-center gap-2">
              <code class="flex-1 bg-muted px-3 py-2 font-mono text-xs">
                {unixCmd}
              </code>
              <Button variant="outline" size="xs" data-copy={unixCmd}>
                <Icon name="copy" class="size-3" />
                Copy
              </Button>
            </div>
          </div>

          {/* Windows install */}
          <div data-os-panel="windows" class="hidden">
            <div class="flex items-center gap-2">
              <code class="flex-1 bg-muted px-3 py-2 font-mono text-xs">
                {winCmd}
              </code>
              <Button variant="outline" size="xs" data-copy={winCmd}>
                <Icon name="copy" class="size-3" />
                Copy
              </Button>
            </div>
          </div>

          {/* Usage examples */}
          <div class="mt-4 border-t border-border pt-3">
            <h3 class="mb-2 text-xs font-semibold font-heading">Then use it</h3>
            <code class="block bg-muted px-3 py-2 font-mono text-xs leading-relaxed">
              {examples.map((ex, i) => (
                <>
                  {i > 0 && <br />}
                  {ex}
                </>
              ))}
            </code>
          </div>
        </div>
      </div>
    </section>
  );
};
