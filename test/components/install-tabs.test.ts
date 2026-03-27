import { describe, it, expect } from "vitest";
import { agentPromptPackage } from "../../src/lib/get-started";

describe("install-tabs", () => {
  // Test the data logic used by InstallTabs component

  function humanCommand(fullName: string): string {
    return `ctx install @${fullName}`;
  }

  describe("humanCommand", () => {
    it("generates correct human install command", () => {
      expect(humanCommand("hong/my-skill")).toBe("ctx install @hong/my-skill");
      expect(humanCommand("mcp/github")).toBe("ctx install @mcp/github");
    });

    it("handles special characters in name", () => {
      expect(humanCommand("scope/name-with-dashes")).toBe(
        "ctx install @scope/name-with-dashes",
      );
    });
  });

  describe("agentPromptPackage", () => {
    it("generates per-package skill.md URL", () => {
      expect(agentPromptPackage("community/ripgrep")).toBe(
        "Read https://getctx.org/@community/ripgrep/skill.md",
      );
    });

    it("starts with Read verb", () => {
      expect(agentPromptPackage("test/pkg")).toMatch(/^Read /);
    });

    it("includes the full_name with @ prefix", () => {
      expect(agentPromptPackage("hong/icons")).toContain("@hong/icons");
    });
  });

  it("human and agent outputs are different", () => {
    const name = "test/pkg";
    expect(humanCommand(name)).not.toBe(agentPromptPackage(name));
  });
});
