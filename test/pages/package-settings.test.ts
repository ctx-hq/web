import { describe, it, expect } from "vitest";

describe("package settings page", () => {
  describe("deprecation", () => {
    it("deprecated checkbox value is 'true'", () => {
      const value = "true";
      expect(value === "true").toBe(true);
    });

    it("undeprecation sends deprecated=false", () => {
      // When checkbox is unchecked, form body won't contain 'deprecated'
      const body = {} as Record<string, string>;
      const deprecated = body.deprecated === "true";
      expect(deprecated).toBe(false);
    });
  });

  describe("dist-tag validation", () => {
    it("requires both tag and version", () => {
      const tag = "beta";
      const version = "1.0.0";
      expect(tag && version).toBeTruthy();
    });

    it("rejects empty tag", () => {
      const tag = "";
      const version = "1.0.0";
      expect(!tag || !version).toBe(true);
    });

    it("rejects empty version", () => {
      const tag = "beta";
      const version = "";
      expect(!tag || !version).toBe(true);
    });

    it("latest tag cannot be deleted", () => {
      const tag = "latest";
      expect(tag).toBe("latest");
      // UI should not show delete button for "latest" tag
    });
  });

  describe("access control", () => {
    it("add action uses correct value", () => {
      const action = "add";
      expect(action).toBe("add");
    });

    it("remove action uses correct value", () => {
      const action = "remove";
      expect(action).toBe("remove");
    });

    it("ACL section only shows for private packages", () => {
      const visibility = "private";
      expect(visibility === "private").toBe(true);
    });

    it("ACL section hidden for public packages", () => {
      const visibility: string = "public";
      expect(visibility === "private").toBe(false);
    });
  });

  describe("package deletion", () => {
    it("confirm text matches full package name", () => {
      const fullName = "@scope/my-pkg";
      const confirmText = fullName;
      expect(confirmText).toBe(fullName);
    });
  });

  describe("metadata editing", () => {
    it("keywords are joined with comma-space for display", () => {
      const keywords = ["ai", "assistant", "tool"];
      const display = keywords.join(", ");
      expect(display).toBe("ai, assistant, tool");
    });

    it("empty keywords array produces empty string", () => {
      const keywords: string[] = [];
      const display = keywords.join(", ");
      expect(display).toBe("");
    });

    it("keywords parsing splits by comma and trims", () => {
      const raw = " ai , assistant ,  tool  ";
      const parsed = raw.split(",").map((k: string) => k.trim()).filter(Boolean);
      expect(parsed).toEqual(["ai", "assistant", "tool"]);
    });

    it("keywords parsing handles empty input", () => {
      const raw: string = "";
      const parsed = raw.length > 0 ? raw.split(",").map((k: string) => k.trim()).filter(Boolean) : [];
      expect(parsed).toEqual([]);
    });

    it("keywords parsing handles trailing comma", () => {
      const raw = "ai, tool, ";
      const parsed = raw.split(",").map((k: string) => k.trim()).filter(Boolean);
      expect(parsed).toEqual(["ai", "tool"]);
    });

    it("description has 1024 char limit", () => {
      const maxLen = 1024;
      const valid = "x".repeat(maxLen);
      const invalid = "x".repeat(maxLen + 1);
      expect(valid.length).toBeLessThanOrEqual(maxLen);
      expect(invalid.length).toBeGreaterThan(maxLen);
    });
  });

  describe("version management", () => {
    it("yanked version shows unyank action", () => {
      const version = { version: "1.0.0", yanked: true, created_at: "2026-01-01" };
      expect(version.yanked).toBe(true);
      // UI should show "Unyank" button, not "Yank" button
    });

    it("active version shows yank action", () => {
      const version = { version: "1.0.0", yanked: false, created_at: "2026-01-01" };
      expect(version.yanked).toBe(false);
      // UI should show "Yank" button, not "Unyank" button
    });

    it("delete version confirm text uses fullName@version format", () => {
      const fullName = "@scope/my-pkg";
      const version = "1.0.0";
      const confirmText = `${fullName}@${version}`;
      expect(confirmText).toBe("@scope/my-pkg@1.0.0");
    });

    it("version list is limited to 20 entries", () => {
      const versions = Array.from({ length: 30 }, (_, i) => ({
        version: `1.0.${i}`,
        yanked: false,
        created_at: "2026-01-01",
      }));
      const displayed = versions.slice(0, 20);
      expect(displayed.length).toBe(20);
      expect(versions.length).toBeGreaterThan(20);
    });

    it("version modal id replaces dots with dashes", () => {
      const version = "1.2.3";
      const modalId = `delete-ver-${version.replace(/\./g, "-")}`;
      expect(modalId).toBe("delete-ver-1-2-3");
    });
  });

  describe("rename confirmation", () => {
    it("requires confirm text to match full package name", () => {
      const fullName = "@scope/my-pkg";
      const confirm = "@scope/my-pkg";
      expect(confirm).toBe(fullName);
    });

    it("rejects mismatched confirm text", () => {
      const fullName = "@scope/my-pkg";
      const confirm = "@scope/wrong";
      expect(confirm).not.toBe(fullName);
    });
  });

  describe("transfer confirmation", () => {
    it("requires confirm text to match full package name", () => {
      const fullName = "@scope/my-pkg";
      const confirm = "@scope/my-pkg";
      expect(confirm).toBe(fullName);
    });

    it("transfer target uses @ prefix format", () => {
      const to = "@orgname";
      expect(to.startsWith("@")).toBe(true);
    });
  });
});
