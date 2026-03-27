import { describe, it, expect } from "vitest";
import {
  SITE_SKILL_URL,
  agentPromptGlobal,
  agentPromptPackage,
  installCommandUnix,
  installCommandWindows,
  usageExamples,
  detectOs,
} from "../../src/lib/get-started";

describe("get-started", () => {
  describe("agentPromptGlobal", () => {
    it("starts with Read verb", () => {
      expect(agentPromptGlobal()).toMatch(/^Read /);
    });

    it("contains the site skill.md URL", () => {
      expect(agentPromptGlobal()).toContain(SITE_SKILL_URL);
    });

    it("is a single line with no newlines", () => {
      expect(agentPromptGlobal()).not.toContain("\n");
    });
  });

  describe("agentPromptPackage", () => {
    it("includes the package full_name with @ prefix", () => {
      expect(agentPromptPackage("hong/my-skill")).toContain("@hong/my-skill");
    });

    it("starts with Read verb", () => {
      expect(agentPromptPackage("scope/name")).toMatch(/^Read /);
    });

    it("points to a per-package skill.md URL", () => {
      expect(agentPromptPackage("mcp/github")).toBe(
        "Read https://getctx.org/@mcp/github/skill.md",
      );
    });

    it("handles names with dashes", () => {
      expect(agentPromptPackage("scope/name-with-dashes")).toContain(
        "@scope/name-with-dashes/skill.md",
      );
    });
  });

  describe("installCommandUnix", () => {
    it("uses curl", () => {
      expect(installCommandUnix()).toContain("curl");
    });

    it("targets install.sh", () => {
      expect(installCommandUnix()).toContain("install.sh");
    });

    it("pipes to sh", () => {
      expect(installCommandUnix()).toMatch(/\|\s*sh$/);
    });
  });

  describe("installCommandWindows", () => {
    it("uses irm (PowerShell)", () => {
      expect(installCommandWindows()).toContain("irm");
    });

    it("targets install.ps1", () => {
      expect(installCommandWindows()).toContain("install.ps1");
    });

    it("pipes to iex", () => {
      expect(installCommandWindows()).toMatch(/\|\s*iex$/);
    });

    it("is different from the unix command", () => {
      expect(installCommandWindows()).not.toBe(installCommandUnix());
    });
  });

  describe("usageExamples", () => {
    it("returns exactly 3 examples", () => {
      expect(usageExamples()).toHaveLength(3);
    });

    it("includes search, install, and serve commands", () => {
      const examples = usageExamples();
      expect(examples.some((e) => e.includes("search"))).toBe(true);
      expect(examples.some((e) => e.includes("install"))).toBe(true);
      expect(examples.some((e) => e.includes("serve"))).toBe(true);
    });

    it("all examples start with ctx", () => {
      for (const ex of usageExamples()) {
        expect(ex).toMatch(/^ctx /);
      }
    });
  });

  describe("detectOs", () => {
    it("detects Windows from navigator.platform 'Win32'", () => {
      expect(detectOs("Win32")).toBe("windows");
    });

    it("detects Windows from user agent containing 'Windows'", () => {
      expect(detectOs("Mozilla/5.0 (Windows NT 10.0; Win64)")).toBe("windows");
    });

    it("detects unix from macOS platform", () => {
      expect(detectOs("MacIntel")).toBe("unix");
    });

    it("detects unix from Linux user agent", () => {
      expect(detectOs("Mozilla/5.0 (X11; Linux x86_64)")).toBe("unix");
    });

    it("defaults to unix for empty string", () => {
      expect(detectOs("")).toBe("unix");
    });

    it("defaults to unix for unknown platform", () => {
      expect(detectOs("SomeUnknownPlatform")).toBe("unix");
    });
  });
});
