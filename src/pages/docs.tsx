import type { FC } from "hono/jsx";
import { Container } from "../components/ui/container";

export const VALID_DOC_SECTIONS = ["getting-started", "spec", "api", "publish"] as const;
export type DocSection = (typeof VALID_DOC_SECTIONS)[number];

export const DocsPage: FC<{ section?: string }> = ({ section }) => (
  <Container size="narrow" class="py-8">
    <h1 class="mb-6 text-base font-semibold font-heading">Documentation</h1>

    <nav class="mb-8 flex gap-1 border-b border-border">
      {([
        { href: "/docs", label: "Getting Started", active: !section },
        { href: "/docs/spec", label: "ctx.yaml Spec", active: section === "spec" },
        { href: "/docs/api", label: "API Reference", active: section === "api" },
        { href: "/docs/publish", label: "Publishing", active: section === "publish" },
      ] as const).map((tab) => (
        <a
          href={tab.href}
          class={`px-3 py-2 text-xs font-medium transition-colors ${
            tab.active
              ? "border-b-2 border-foreground text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          }`}
          {...(tab.active ? { "aria-current": "page" } : {})}
        >
          {tab.label}
        </a>
      ))}
    </nav>

    <div class="prose">
      {(!section || section === "getting-started") && <GettingStarted />}
      {section === "spec" && <CtxYamlSpec />}
      {section === "api" && <ApiReference />}
      {section === "publish" && <Publishing />}
    </div>
  </Container>
);

const GettingStarted: FC = () => (
  <>
    <h2>Install ctx</h2>
    <pre><code>curl -fsSL https://getctx.org/install.sh | sh</code></pre>
    <h2>Search for packages</h2>
    <pre><code>ctx search "code review"</code></pre>
    <h2>Install a package</h2>
    <pre><code>{`ctx install @anthropic/memory-mcp  # MCP server
ctx install @community/ripgrep    # CLI tool
ctx install @hong/code-review     # Skill`}</code></pre>
    <h2>Use as MCP server</h2>
    <p>Add ctx to your agent's MCP configuration:</p>
    <pre><code>{`{
  "mcpServers": {
    "ctx": {
      "command": "ctx",
      "args": ["serve"]
    }
  }
}`}</code></pre>
    <p>Now your AI agent can search and install packages directly.</p>
  </>
);

const CtxYamlSpec: FC = () => (
  <>
    <h2>ctx.yaml Specification</h2>
    <p>Every package is defined by a <code>ctx.yaml</code> manifest file.</p>
    <h3>Required fields</h3>
    <pre><code>{`name: "@scope/name"    # @scope/name format
version: "1.0.0"       # semver
type: skill | mcp | cli
description: "..."     # max 1024 chars`}</code></pre>
    <h3>Skill type</h3>
    <pre><code>{`skill:
  entry: SKILL.md
  tags: [code-review, git]
  compatibility: "claude-code, cursor"`}</code></pre>
    <h3>MCP type</h3>
    <pre><code>{`mcp:
  transport: stdio
  command: npx
  args: ["-y", "@mcp/github"]
  env:
    - name: GITHUB_TOKEN
      required: true`}</code></pre>
    <h3>CLI type</h3>
    <pre><code>{`cli:
  binary: rg
  verify: "rg --version"
install:
  brew: ripgrep
  cargo: ripgrep`}</code></pre>
  </>
);

const ApiReference: FC = () => (
  <>
    <h2>API Reference</h2>
    <p>Base URL: <code>https://api.getctx.org</code></p>
    <h3>Search</h3>
    <pre><code>GET /v1/search?q=query&amp;type=mcp&amp;limit=20</code></pre>
    <h3>Package detail</h3>
    <pre><code>GET /v1/packages/@scope/name</code></pre>
    <h3>Publish</h3>
    <pre><code>POST /v1/publish (multipart, auth required)</code></pre>
    <h3>Resolve</h3>
    <pre><code>{`POST /v1/resolve
{"packages": {"@scope/name": "^1.0"}}`}</code></pre>
  </>
);

const Publishing: FC = () => (
  <>
    <h2>Publishing packages</h2>
    <pre><code>{`ctx login                 # GitHub OAuth
ctx init --type skill     # Create ctx.yaml
ctx validate              # Check manifest
ctx publish               # Publish to registry`}</code></pre>
    <h3>Version management</h3>
    <pre><code>{`ctx outdated              # Check for updates
ctx update                # Update all packages
ctx yank @scope/name@1.0  # Retract a version`}</code></pre>
  </>
);
