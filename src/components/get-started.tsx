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
      <div class="install-tabs cn-card mx-auto max-w-xl">
        {/* Tab bar — Agent default */}
        <nav class="flex gap-4 border-b border-input px-3" role="tablist" aria-label="Getting started method">
          <button
            data-tab="agent"
            id="tab-agent"
            role="tab"
            aria-selected="true"
            aria-controls="panel-agent"
            class="cn-install-tab cn-install-tab-active"
          >
            <Icon name="robot" class="size-3.5" />
            Agent
          </button>
          <button
            data-tab="human"
            id="tab-human"
            role="tab"
            aria-selected="false"
            aria-controls="panel-human"
            class="cn-install-tab"
          >
            <Icon name="terminal" class="size-3.5" />
            Human
          </button>
        </nav>

        {/* Agent panel (visible by default) */}
        <div data-panel="agent" id="panel-agent" role="tabpanel" aria-labelledby="tab-agent" class="p-4">
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-muted px-3 py-2 font-mono text-xs">
              {agentCmd}
            </code>
            <Button variant="outline" size="xs" data-copy={agentCmd}>
              <Icon name="copy" class="size-3" />
              Copy
            </Button>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            Send this to your Agent to get started with ctx
          </p>
        </div>

        {/* Human panel (hidden by default) */}
        <div data-panel="human" id="panel-human" role="tabpanel" aria-labelledby="tab-human" class="hidden p-4">
          {/* OS toggle */}
          <div class="os-toggle mb-3 flex gap-3 text-sm" data-os-container>
            <button
              data-os-toggle="unix"
              class="flex items-center gap-1.5 font-medium"
            >
              <Icon name="apple-logo" class="size-3.5" />
              <Icon name="linux-logo" class="size-3.5" />
              macOS / Linux
            </button>
            <button
              data-os-toggle="windows"
              class="flex items-center gap-1.5 text-muted-foreground"
            >
              <Icon name="windows-logo" class="size-3.5" />
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
            <h3 class="mb-2 text-sm font-semibold font-heading">Then use it</h3>
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
