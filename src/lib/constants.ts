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
