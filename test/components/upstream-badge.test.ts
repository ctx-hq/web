import { describe, it, expect } from "vitest";
import { resolveUpstreamDisplay } from "../../src/components/upstream-badge";

describe("resolveUpstreamDisplay", () => {
  it("resolves npm upstream to npmjs.com link", () => {
    const result = resolveUpstreamDisplay({ npm: "@playwright/mcp" });
    expect(result.label).toBe("@playwright/mcp on npm");
    expect(result.url).toBe("https://www.npmjs.com/package/@playwright/mcp");
  });

  it("resolves github upstream to github.com link", () => {
    const result = resolveUpstreamDisplay({ github: "github/github-mcp-server" });
    expect(result.label).toBe("github/github-mcp-server on GitHub");
    expect(result.url).toBe("https://github.com/github/github-mcp-server");
  });

  it("resolves docker upstream with ghcr.io link", () => {
    const result = resolveUpstreamDisplay({ docker: "ghcr.io/github/github-mcp-server" });
    expect(result.label).toBe("ghcr.io/github/github-mcp-server on Docker");
    expect(result.url).toContain("github.com");
  });

  it("resolves docker upstream without ghcr.io", () => {
    const result = resolveUpstreamDisplay({ docker: "myregistry.io/org/image" });
    expect(result.label).toBe("myregistry.io/org/image on Docker");
    expect(result.url).toBe(""); // no link for non-ghcr registries
  });

  it("returns empty for no sources", () => {
    const result = resolveUpstreamDisplay({});
    expect(result.label).toBe("");
    expect(result.url).toBe("");
  });

  it("prefers npm over github when both present", () => {
    const result = resolveUpstreamDisplay({ npm: "@test/pkg", github: "test/pkg" });
    expect(result.label).toContain("npm");
  });
});
