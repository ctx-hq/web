export const SITE_NAME = "getctx.org";
export const SITE_TAGLINE = "One command to extend your AI agent";
export const SITE_DESCRIPTION =
  "Discover, install, and manage skills, MCP servers, and CLI tools for AI agents.";
export const SITE_URL = "https://getctx.org";
export const DEFAULT_OG_IMAGE = "https://getctx.org/og-default.png";
export const PACKAGE_TYPES = ["skill", "cli", "mcp"] as const;

export const SORT_OPTIONS = [
  { value: "downloads", label: "Downloads" },
  { value: "newest", label: "Newest" },
] as const;

export const PLACEHOLDER_BY_TYPE: Record<string, string> = {
  "": "Search skills, MCP servers, CLI tools...",
  skill: "Search skills...",
  mcp: "Search MCP servers...",
  cli: "Search CLI tools...",
};

/** Display labels for package types (acronyms uppercased). */
export const TYPE_DISPLAY_LABELS: Record<string, string> = {
  skill: "Skill",
  cli: "CLI",
  mcp: "MCP",
  collection: "Collection",
};

/** Trust tier display configuration. */
export const TRUST_TIERS: Record<string, { label: string; color: string; icon: string }> = {
  unverified: { label: "Unverified", color: "text-muted-foreground", icon: "" },
  structural: { label: "Structural", color: "text-trust-structural", icon: "✓" },
  source_linked: { label: "Source Linked", color: "text-trust-source-linked", icon: "✓" },
  reviewed: { label: "Reviewed", color: "text-trust-reviewed", icon: "✓" },
  verified: { label: "Verified", color: "text-trust-verified", icon: "✓" },
};

/** Visibility display configuration. */
export const VISIBILITY_CONFIG: Record<string, { label: string }> = {
  public: { label: "Public" },
  unlisted: { label: "Unlisted" },
  private: { label: "Private" },
};

/** MCP transport type display labels. */
export const MCP_TRANSPORT_LABELS: Record<string, string> = {
  stdio: "STDIO",
  http: "HTTP",
  sse: "SSE",
  "streamable-http": "Streamable HTTP",
};

/** Agent display names for readable output. */
export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  claude: "Claude", cursor: "Cursor", windsurf: "Windsurf",
  codex: "Codex", copilot: "Copilot", cline: "Cline",
  zed: "Zed", roo: "Roo", goose: "Goose", amp: "Amp",
  opencode: "OpenCode", continue: "Continue",
};
