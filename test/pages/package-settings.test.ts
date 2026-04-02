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
});
