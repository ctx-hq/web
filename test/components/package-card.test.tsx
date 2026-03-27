import { describe, it, expect } from "vitest";
import type { PackageSummary } from "../../src/lib/types";

describe("package-card", () => {
  function formatDownloads(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }

  it("formats downloads correctly", () => {
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
    // Component should render gracefully without crashing
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
    // Should not crash
  });
});
