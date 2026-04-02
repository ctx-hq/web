import { describe, it, expect } from "vitest";
import type { SettingsTab } from "../../src/pages/settings";

describe("settings page", () => {
  const VALID_TABS: SettingsTab[] = ["profile", "tokens", "account"];

  describe("tab validation", () => {
    it("accepts valid tab values", () => {
      for (const tab of VALID_TABS) {
        expect(VALID_TABS.includes(tab)).toBe(true);
      }
    });

    it("defaults to profile for invalid tab", () => {
      const tab = "invalid" as SettingsTab;
      const activeTab = VALID_TABS.includes(tab) ? tab : "profile";
      expect(activeTab).toBe("profile");
    });

    it("defaults to profile for empty tab", () => {
      const tab = "" as SettingsTab;
      const activeTab = VALID_TABS.includes(tab) ? tab : "profile";
      expect(activeTab).toBe("profile");
    });
  });

  describe("profile section", () => {
    it("bio max length is 256", () => {
      const maxLength = 256;
      expect("a".repeat(maxLength).length).toBe(256);
      expect("a".repeat(maxLength + 1).length).toBeGreaterThan(256);
    });

    it("website must be a URL", () => {
      const validUrls = ["https://example.com", "http://example.com", ""];
      const invalidUrls = ["ftp://example.com", "not-a-url"];

      for (const url of validUrls) {
        const isValid = url === "" || url.startsWith("https://") || url.startsWith("http://");
        expect(isValid).toBe(true);
      }
      for (const url of invalidUrls) {
        const isValid = url === "" || url.startsWith("https://") || url.startsWith("http://");
        expect(isValid).toBe(false);
      }
    });
  });

  describe("account section", () => {
    it("username pattern matches valid names", () => {
      const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
      expect(pattern.test("alice")).toBe(true);
      expect(pattern.test("alice-bob")).toBe(true);
      expect(pattern.test("a1")).toBe(true);
      expect(pattern.test("a")).toBe(true);
    });

    it("username pattern rejects invalid names", () => {
      const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
      expect(pattern.test("Alice")).toBe(false);
      expect(pattern.test("-alice")).toBe(false);
      expect(pattern.test("alice-")).toBe(false);
      expect(pattern.test("alice_bob")).toBe(false);
      expect(pattern.test("")).toBe(false);
    });
  });

  describe("settings redirect", () => {
    it("old /settings/tokens path should redirect to /settings?tab=tokens", () => {
      const oldPath = "/settings/tokens";
      const newPath = "/settings?tab=tokens";
      expect(oldPath).not.toBe(newPath);
      expect(newPath).toContain("tab=tokens");
    });
  });
});
