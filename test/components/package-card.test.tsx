import { describe, it, expect } from "vitest";
import type { PackageSummary } from "../../src/lib/types";
import { formatDownloads } from "../../src/lib/format";

describe("package-card", () => {
  it("formats downloads correctly via shared utility", () => {
    expect(formatDownloads(0)).toBe("0");
    expect(formatDownloads(42)).toBe("42");
    expect(formatDownloads(999)).toBe("999");
    expect(formatDownloads(1000)).toBe("1.0k");
    expect(formatDownloads(1500)).toBe("1.5k");
    expect(formatDownloads(45000)).toBe("45.0k");
    expect(formatDownloads(1000000)).toBe("1.0M");
    expect(formatDownloads(2500000)).toBe("2.5M");
  });

  it("generates correct link URL from full_name", () => {
    const pkg: PackageSummary = {
      full_name: "hong/my-skill",
      type: "skill",
      description: "test",
      version: "1.0.0",
      downloads: 100,
      repository: "",
    };
    const href = `/@${pkg.full_name}`;
    expect(href).toBe("/@hong/my-skill");
  });

  it("handles empty description", () => {
    const pkg: PackageSummary = {
      full_name: "test/empty",
      type: "mcp",
      description: "",
      version: "0.1.0",
      downloads: 0,
      repository: "",
    };
    expect(pkg.description).toBe("");
  });

  it("handles missing version", () => {
    const pkg: PackageSummary = {
      full_name: "test/no-ver",
      type: "cli",
      description: "test",
      version: "",
      downloads: 0,
      repository: "",
    };
    expect(`v${pkg.version}`).toBe("v");
  });

  it("includes trust_tier in PackageSummary", () => {
    const pkg: PackageSummary = {
      full_name: "hong/verified-skill",
      type: "skill",
      description: "A verified skill",
      version: "1.0.0",
      downloads: 500,
      repository: "",
      trust_tier: "verified",
    };
    expect(pkg.trust_tier).toBe("verified");
  });

  it("handles undefined trust_tier (optional field)", () => {
    const pkg: PackageSummary = {
      full_name: "hong/basic",
      type: "skill",
      description: "Basic skill",
      version: "1.0.0",
      downloads: 10,
      repository: "",
    };
    expect(pkg.trust_tier).toBeUndefined();
  });

  it("includes publisher_slug in PackageSummary", () => {
    const pkg: PackageSummary = {
      full_name: "hong/my-tool",
      type: "cli",
      description: "My tool",
      version: "2.0.0",
      downloads: 200,
      repository: "",
      publisher_slug: "hong",
    };
    expect(pkg.publisher_slug).toBe("hong");
  });

  it("handles undefined publisher_slug (optional field)", () => {
    const pkg: PackageSummary = {
      full_name: "test/no-pub",
      type: "mcp",
      description: "No publisher",
      version: "0.1.0",
      downloads: 0,
      repository: "",
    };
    expect(pkg.publisher_slug).toBeUndefined();
  });

  it("combines trust_tier and publisher_slug", () => {
    const pkg: PackageSummary = {
      full_name: "acme/enterprise-tool",
      type: "cli",
      description: "Enterprise grade tool",
      version: "3.0.0",
      downloads: 10000,
      repository: "https://github.com/acme/enterprise-tool",
      trust_tier: "reviewed",
      publisher_slug: "acme",
    };
    expect(pkg.trust_tier).toBe("reviewed");
    expect(pkg.publisher_slug).toBe("acme");
    expect(`/@${pkg.full_name}`).toBe("/@acme/enterprise-tool");
  });
});
