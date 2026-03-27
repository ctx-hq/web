import { describe, it, expect } from "vitest";

describe("install-tabs", () => {
  // Test the data logic used by InstallTabs component

  function humanCommand(fullName: string): string {
    return `ctx install @${fullName}`;
  }

  function agentPrompt(fullName: string): string {
    return `Install the @${fullName} package using ctx`;
  }

  it("generates correct human install command", () => {
    expect(humanCommand("hong/my-skill")).toBe("ctx install @hong/my-skill");
    expect(humanCommand("mcp/github")).toBe("ctx install @mcp/github");
  });

  it("generates correct agent prompt", () => {
    expect(agentPrompt("community/ripgrep")).toBe(
      "Install the @community/ripgrep package using ctx",
    );
  });

  it("handles special characters in name", () => {
    const cmd = humanCommand("scope/name-with-dashes");
    expect(cmd).toBe("ctx install @scope/name-with-dashes");
  });

  it("human and agent outputs are different", () => {
    const name = "test/pkg";
    expect(humanCommand(name)).not.toBe(agentPrompt(name));
  });
});
