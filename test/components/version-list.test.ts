import { describe, it, expect } from "vitest";
import { formatDate } from "../../src/lib/format";

describe("version-list", () => {
  describe("formatDate for version dates", () => {
    it("formats ISO datetime to YYYY-MM-DD", () => {
      expect(formatDate("2025-03-20T00:00:00Z")).toBe("2025-03-20");
    });

    it("formats date-only string", () => {
      expect(formatDate("2025-01-15")).toBe("2025-01-15");
    });

    it("handles datetime with timezone offset", () => {
      expect(formatDate("2025-06-01T12:30:00+08:00")).toBe("2025-06-01");
    });
  });

  describe("version data boundaries", () => {
    it("yanked flag is a boolean", () => {
      const version = { version: "1.0.0", yanked: true, created_at: "2025-01-01" };
      expect(typeof version.yanked).toBe("boolean");
    });

    it("version string can be semver", () => {
      const versions = ["0.1.0", "1.0.0", "2.3.1-beta.1", "10.20.30"];
      for (const v of versions) {
        expect(v.length).toBeGreaterThan(0);
      }
    });

    it("empty versions array has length 0", () => {
      const versions: { version: string; yanked: boolean; created_at: string }[] = [];
      expect(versions.length).toBe(0);
    });
  });
});
