import { describe, it, expect } from "vitest";
import { buildAgentConfigs, buildTransportOptions } from "../../src/components/mcp-agent-configs";
import type { ManifestInfo } from "../../src/lib/types";

describe("buildTransportOptions", () => {
  it("returns single option for simple MCP", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp"],
    };
    const options = buildTransportOptions(mcp);
    expect(options).toHaveLength(1);
    expect(options[0].id).toBe("default");
    expect(options[0].label).toContain("npx");
  });

  it("returns multiple options for multi-transport MCP", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "docker",
      transports: [
        { id: "stdio-docker", label: "Docker (stdio)", transport: "stdio", command: "docker" },
        { id: "remote", label: "Remote (HTTP)", transport: "streamable-http", url: "https://api.example.com/mcp/" },
      ],
    };
    const options = buildTransportOptions(mcp);
    expect(options).toHaveLength(3); // default + 2 transports
    expect(options[0].id).toBe("default");
    expect(options[1].id).toBe("stdio-docker");
    expect(options[2].id).toBe("remote");
  });
});

describe("buildAgentConfigs", () => {
  it("generates 4 agent configs for default transport", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp"],
      env: [{ name: "API_KEY", required: true }],
    };
    const configs = buildAgentConfigs("playwright", mcp);
    expect(configs).toHaveLength(4);
    expect(configs.map((c) => c.id)).toEqual(["claude", "cursor", "vscode", "ctx"]);
  });

  it("includes command in Claude config for stdio", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "npx",
      args: ["-y", "@playwright/mcp"],
    };
    const configs = buildAgentConfigs("playwright", mcp);
    const claude = configs.find((c) => c.id === "claude")!;
    const parsed = JSON.parse(claude.config);
    expect(parsed.mcpServers.playwright.command).toBe("npx");
    expect(parsed.mcpServers.playwright.args).toEqual(["-y", "@playwright/mcp"]);
  });

  it("includes url in config for remote transport", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "docker",
      transports: [
        { id: "remote", transport: "streamable-http", url: "https://api.example.com/mcp/" },
      ],
    };
    const configs = buildAgentConfigs("github", mcp, "remote");
    const claude = configs.find((c) => c.id === "claude")!;
    const parsed = JSON.parse(claude.config);
    expect(parsed.mcpServers.github.url).toBe("https://api.example.com/mcp/");
    expect(parsed.mcpServers.github.command).toBeUndefined();
  });

  it("uses transport env vars when selecting named transport", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "docker",
      env: [{ name: "TOKEN", required: true }],
      transports: [
        {
          id: "remote",
          transport: "streamable-http",
          url: "https://api.example.com/mcp/",
          env: [{ name: "REMOTE_KEY", required: true }],
        },
      ],
    };
    const configs = buildAgentConfigs("test", mcp, "remote");
    const claude = configs.find((c) => c.id === "claude")!;
    const parsed = JSON.parse(claude.config);
    // Should use transport's env, not default env
    expect(parsed.mcpServers.test.env.REMOTE_KEY).toBeDefined();
    expect(parsed.mcpServers.test.env.TOKEN).toBeUndefined();
  });

  it("includes --transport flag in ctx command for named transport", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "docker",
      transports: [{ id: "remote", transport: "streamable-http", url: "https://..." }],
    };
    const configs = buildAgentConfigs("github", mcp, "remote");
    const ctx = configs.find((c) => c.id === "ctx")!;
    expect(ctx.config).toContain("--transport=remote");
  });

  it("env placeholder uses YOUR_ prefix", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "npx",
      env: [{ name: "GITHUB_TOKEN", required: true }],
    };
    const configs = buildAgentConfigs("test", mcp);
    const claude = configs.find((c) => c.id === "claude")!;
    expect(claude.config).toContain("YOUR_GITHUB_TOKEN");
  });

  it("falls back to default transport for unknown transportId", () => {
    const mcp: NonNullable<ManifestInfo["mcp"]> = {
      transport: "stdio",
      command: "npx",
      args: ["-y", "pkg"],
    };
    const configs = buildAgentConfigs("test", mcp, "nonexistent");
    const claude = configs.find((c) => c.id === "claude")!;
    const parsed = JSON.parse(claude.config);
    expect(parsed.mcpServers.test.command).toBe("npx");
  });
});
