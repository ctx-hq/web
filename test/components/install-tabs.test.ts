import { describe, it, expect } from "vitest";
import { agentPromptPackage } from "../../src/lib/get-started";

describe("install-tabs", () => {
  // Test the data logic used by InstallTabs component
  // fullName from DB includes @ prefix: "@scope/name"

  function humanCommand(fullName: string): string {
    return `ctx install ${fullName}`;
  }

  describe("humanCommand", () => {
    it("generates correct human install command", () => {
      expect(humanCommand("@hong/my-skill")).toBe("ctx install @hong/my-skill");
      expect(humanCommand("@mcp/github")).toBe("ctx install @mcp/github");
    });

    it("does not produce double @@", () => {
      expect(humanCommand("@community/test")).not.toContain("@@");
    });
  });

  describe("agentPromptPackage", () => {
    it("generates per-package .ctx URL", () => {
      expect(agentPromptPackage("@community/ripgrep")).toBe(
        "Read https://getctx.org/@community/ripgrep.ctx and follow the instructions to use @community/ripgrep",
      );
    });

    it("starts with Read verb", () => {
      expect(agentPromptPackage("@test/pkg")).toMatch(/^Read /);
    });

    it("does not produce double @@", () => {
      expect(agentPromptPackage("@hong/icons")).not.toContain("@@");
    });
  });

  it("human and agent outputs are different", () => {
    const name = "@test/pkg";
    expect(humanCommand(name)).not.toBe(agentPromptPackage(name));
  });
});
