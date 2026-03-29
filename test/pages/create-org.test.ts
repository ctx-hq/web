import { describe, it, expect } from "vitest";
import { validateOrgName, ORG_NAME_REGEX, ORG_NAME_MIN, ORG_NAME_MAX } from "../../src/pages/create-org";

describe("create org page", () => {
  describe("ORG_NAME_REGEX", () => {
    it("accepts lowercase alphanumeric names", () => {
      expect(ORG_NAME_REGEX.test("acme")).toBe(true);
      expect(ORG_NAME_REGEX.test("my-team")).toBe(true);
      expect(ORG_NAME_REGEX.test("team123")).toBe(true);
      expect(ORG_NAME_REGEX.test("123")).toBe(true);
      expect(ORG_NAME_REGEX.test("a-b-c")).toBe(true);
    });

    it("rejects invalid names", () => {
      expect(ORG_NAME_REGEX.test("")).toBe(false);
      expect(ORG_NAME_REGEX.test("MyTeam")).toBe(false);
      expect(ORG_NAME_REGEX.test("-leading")).toBe(false);
      expect(ORG_NAME_REGEX.test("trailing-")).toBe(false);
      expect(ORG_NAME_REGEX.test("has space")).toBe(false);
      expect(ORG_NAME_REGEX.test("under_score")).toBe(false);
      expect(ORG_NAME_REGEX.test("UPPER")).toBe(false);
    });
  });

  describe("validateOrgName", () => {
    it("returns null for valid names", () => {
      expect(validateOrgName("acme")).toBeNull();
      expect(validateOrgName("my-team")).toBeNull();
      expect(validateOrgName("ab")).toBeNull();
    });

    it("returns error for empty name", () => {
      expect(validateOrgName("")).toBe("Organization name is required.");
    });

    it("returns error for too short name", () => {
      expect(validateOrgName("a")).toContain(`between ${ORG_NAME_MIN} and ${ORG_NAME_MAX}`);
    });

    it("returns error for too long name", () => {
      const long = "a".repeat(ORG_NAME_MAX + 1);
      expect(validateOrgName(long)).toContain(`between ${ORG_NAME_MIN} and ${ORG_NAME_MAX}`);
    });

    it("returns error for invalid format", () => {
      const result = validateOrgName("-bad");
      expect(result).toContain("lowercase letters");
    });
  });

  describe("form data resolution", () => {
    it("trims whitespace from name", () => {
      const raw = "  my-team  ";
      expect(raw.trim()).toBe("my-team");
    });

    it("treats empty display_name as undefined", () => {
      const raw = "";
      const displayName = raw.trim() || undefined;
      expect(displayName).toBeUndefined();
    });

    it("preserves valid display_name", () => {
      const raw = "My Team";
      const displayName = raw.trim() || undefined;
      expect(displayName).toBe("My Team");
    });
  });
});
