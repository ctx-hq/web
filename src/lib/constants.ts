export const SITE_NAME = "getctx.org";
export const SITE_TAGLINE = "Universal package manager for LLM context";
export const SITE_DESCRIPTION =
  "Discover, install, and manage skills, MCP servers, and CLI tools for AI agents.";
export const SITE_URL = "https://getctx.org";
export const DEFAULT_OG_IMAGE = "https://getctx.org/og-default.png";
export const PACKAGE_TYPES = ["skill", "mcp", "cli"] as const;

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

/** Trust tier display configuration. */
export const TRUST_TIERS: Record<string, { label: string; color: string; icon: string }> = {
  unverified: { label: "Unverified", color: "text-muted-foreground", icon: "" },
  structural: { label: "Structural", color: "text-yellow-600 dark:text-yellow-400", icon: "✓" },
  source_linked: { label: "Source Linked", color: "text-blue-600 dark:text-blue-400", icon: "✓" },
  reviewed: { label: "Reviewed", color: "text-green-600 dark:text-green-400", icon: "✓" },
  verified: { label: "Verified", color: "text-emerald-600 dark:text-emerald-400", icon: "✓" },
};

/** Visibility display configuration. */
export const VISIBILITY_CONFIG: Record<string, { label: string; icon: string }> = {
  public: { label: "Public", icon: "\u{1F310}" },
  unlisted: { label: "Unlisted", icon: "\u{1F517}" },
  private: { label: "Private", icon: "\u{1F512}" },
};

/** Agent display names for readable output. */
export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  claude: "Claude", cursor: "Cursor", windsurf: "Windsurf",
  codex: "Codex", copilot: "Copilot", cline: "Cline",
  zed: "Zed", roo: "Roo", goose: "Goose", amp: "Amp",
  opencode: "OpenCode", continue: "Continue",
};
