import type { FC } from "hono/jsx";
import type { PackageType, ManifestInfo } from "../lib/types";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { agentPromptPackage } from "../lib/get-started";

export const InstallTabs: FC<{
  fullName: string;
  pkgType?: PackageType;
  manifest?: ManifestInfo | null;
}> = ({ fullName, pkgType, manifest }) => {
  const agentCmd = agentPromptPackage(fullName);
  const installCmd = `ctx install @${fullName}`;

  // Type-specific human install hint
  let humanHint = "";
  if (pkgType === "mcp") {
    humanHint = "Installs and registers the MCP server with your agents";
  } else if (pkgType === "cli" || manifest?.cli?.binary) {
    const binary = manifest?.cli?.binary;
    humanHint = binary
      ? `Installs ${binary} CLI and links skill to your agents`
      : "Installs CLI tool via the best available package manager";
  } else {
    humanHint = "Installs and links the skill to all detected agents";
  }

  // Direct install alternative if available
  const altInstall = manifest?.install?.brew
    ? `brew install ${manifest.install.brew}`
    : manifest?.install?.npm
      ? `npm install -g ${manifest.install.npm}`
      : manifest?.install?.pip
        ? `pip install ${manifest.install.pip}`
        : manifest?.install?.cargo
          ? `cargo install ${manifest.install.cargo}`
          : null;

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
          CLI
        </button>
      </div>
      {/* Agent panel */}
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
      {/* CLI panel */}
      <div data-panel="human" class="hidden p-3">
        <div class="flex items-center gap-2">
          <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
            {installCmd}
          </code>
          <Button variant="outline" size="xs" data-copy={installCmd}>
            <Icon name="copy" class="size-3" />
            Copy
          </Button>
        </div>
        <p class="mt-1.5 text-xs text-muted-foreground">{humanHint}</p>
        {altInstall && (
          <div class="mt-2 border-t border-border pt-2">
            <p class="mb-1 text-[10px] text-muted-foreground">Or install directly:</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 bg-muted px-2 py-1 font-mono text-xs">
                {altInstall}
              </code>
              <Button variant="outline" size="xs" data-copy={altInstall}>
                <Icon name="copy" class="size-3" />
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
