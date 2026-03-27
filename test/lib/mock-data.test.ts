import { describe, it, expect } from "vitest";
import { MOCK_PACKAGES, queryMockPackages, getMockPackageDetail } from "../../src/lib/mock-data";

describe("mock-data", () => {
  describe("MOCK_PACKAGES integrity", () => {
    it("all packages have required fields", () => {
      for (const pkg of MOCK_PACKAGES) {
        expect(pkg.full_name).toBeTruthy();
        expect(pkg.type).toBeTruthy();
        expect(pkg.description).toBeTruthy();
        expect(pkg.version).toBeTruthy();
        expect(typeof pkg.downloads).toBe("number");
      }
    });

    it("all types are valid PackageType", () => {
      const validTypes = ["skill", "mcp", "cli"];
      for (const pkg of MOCK_PACKAGES) {
        expect(validTypes).toContain(pkg.type);
      }
    });

    it("no duplicate full_name", () => {
      const names = MOCK_PACKAGES.map((p) => p.full_name);
      expect(new Set(names).size).toBe(names.length);
    });

    it("has packages of each type", () => {
      const types = new Set(MOCK_PACKAGES.map((p) => p.type));
      expect(types.has("skill")).toBe(true);
      expect(types.has("mcp")).toBe(true);
      expect(types.has("cli")).toBe(true);
    });
  });

  describe("getMockPackageDetail", () => {
    it("returns detail for each mock package", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name);
        expect(detail).not.toBeNull();
        expect(detail!.pkg.full_name).toBe(pkg.full_name);
        expect(detail!.pkg.type).toBe(pkg.type);
      }
    });

    it("returns null for unknown package", () => {
      expect(getMockPackageDetail("unknown/nonexistent")).toBeNull();
    });

    it("all details have non-empty keywords", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(detail.pkg.keywords.length).toBeGreaterThan(0);
      }
    });

    it("all details have non-empty platforms", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(detail.pkg.platforms.length).toBeGreaterThan(0);
      }
    });

    it("all details have at least one version", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(detail.pkg.versions.length).toBeGreaterThan(0);
      }
    });

    it("all details have non-empty readme", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(detail.readme.length).toBeGreaterThan(0);
      }
    });

    it("all details have valid license", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(detail.pkg.license).toBeTruthy();
      }
    });

    it("all details have valid dates", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(new Date(detail.pkg.created_at).getTime()).not.toBeNaN();
        expect(new Date(detail.pkg.updated_at).getTime()).not.toBeNaN();
      }
    });

    it("detail type matches summary type", () => {
      for (const pkg of MOCK_PACKAGES) {
        const detail = getMockPackageDetail(pkg.full_name)!;
        expect(detail.pkg.type).toBe(pkg.type);
      }
    });
  });

  describe("queryMockPackages", () => {
    it("returns all packages with no filters", () => {
      const result = queryMockPackages({});
      expect(result.total).toBe(MOCK_PACKAGES.length);
    });

    it("filters by type", () => {
      const result = queryMockPackages({ type: "skill" });
      expect(result.packages.every((p) => p.type === "skill")).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it("filters by query", () => {
      const result = queryMockPackages({ q: "postgres" });
      expect(result.total).toBeGreaterThan(0);
      expect(result.packages[0].full_name).toContain("postgres");
    });

    it("respects limit and offset", () => {
      const result = queryMockPackages({ limit: 3, offset: 0 });
      expect(result.packages.length).toBe(3);
      expect(result.total).toBe(MOCK_PACKAGES.length);
    });

    it("sorts by downloads by default", () => {
      const result = queryMockPackages({});
      for (let i = 1; i < result.packages.length; i++) {
        expect(result.packages[i - 1].downloads).toBeGreaterThanOrEqual(result.packages[i].downloads);
      }
    });
  });
});
