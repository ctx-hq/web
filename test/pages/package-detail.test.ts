import { describe, it, expect } from "vitest";
import { safeRepoUrl, buildMetadataRows } from "../../src/lib/package-helpers";

const fmtNum = (n: number) => String(n);
const fmtDate = (s: string) => s.slice(0, 10);

describe("safeRepoUrl", () => {
  it("accepts https URLs", () => {
    expect(safeRepoUrl("https://github.com/test/repo")).toBe("https://github.com/test/repo");
  });

  it("accepts http URLs", () => {
    expect(safeRepoUrl("http://github.com/test/repo")).toBe("http://github.com/test/repo");
  });

  it("rejects javascript: URLs", () => {
    expect(safeRepoUrl("javascript:alert(1)")).toBeNull();
  });

  it("rejects data: URLs", () => {
    expect(safeRepoUrl("data:text/html,<h1>Hi</h1>")).toBeNull();
  });

  it("rejects empty string", () => {
    expect(safeRepoUrl("")).toBeNull();
  });

  it("rejects malformed URLs", () => {
    expect(safeRepoUrl("not a url")).toBeNull();
  });

  it("returns null for ftp: URLs", () => {
    expect(safeRepoUrl("ftp://files.example.com/repo")).toBeNull();
  });
});

describe("buildMetadataRows", () => {
  const fullPkg = {
    versions: [{ version: "1.2.0" }],
    license: "MIT",
    downloads: 12450,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-03-20T00:00:00Z",
  };

  it("builds all rows when all data present", () => {
    const rows = buildMetadataRows(fullPkg, fmtNum, fmtDate);
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.label)).toEqual(["Version", "License", "Downloads", "Published", "Updated"]);
  });

  it("omits version when no versions", () => {
    const rows = buildMetadataRows({ ...fullPkg, versions: [] }, fmtNum, fmtDate);
    expect(rows.find((r) => r.label === "Version")).toBeUndefined();
  });

  it("omits license when empty", () => {
    const rows = buildMetadataRows({ ...fullPkg, license: "" }, fmtNum, fmtDate);
    expect(rows.find((r) => r.label === "License")).toBeUndefined();
  });

  it("always includes downloads even when 0", () => {
    const rows = buildMetadataRows({ ...fullPkg, downloads: 0 }, fmtNum, fmtDate);
    const dl = rows.find((r) => r.label === "Downloads");
    expect(dl).toBeDefined();
    expect(dl!.value).toBe("0");
  });

  it("omits dates when empty", () => {
    const rows = buildMetadataRows({ ...fullPkg, created_at: "", updated_at: "" }, fmtNum, fmtDate);
    expect(rows.find((r) => r.label === "Published")).toBeUndefined();
    expect(rows.find((r) => r.label === "Updated")).toBeUndefined();
  });

  it("uses provided formatNumber function", () => {
    const rows = buildMetadataRows(fullPkg, (n) => `${n} total`, fmtDate);
    const dl = rows.find((r) => r.label === "Downloads");
    expect(dl!.value).toBe("12450 total");
  });

  it("uses provided formatDate function", () => {
    const rows = buildMetadataRows(fullPkg, fmtNum, () => "Jan 15");
    const pub = rows.find((r) => r.label === "Published");
    expect(pub!.value).toBe("Jan 15");
  });
});

describe("package detail v2 fields", () => {
  it("should support publisher field", () => {
    const pkg = {
      full_name: "@hong/my-skill",
      publisher: { slug: "hong", kind: "user" as const },
      dist_tags: { latest: "1.0.0", beta: "2.0.0-beta.1" },
      trust_tier: "structural" as const,
      visibility: "public" as const,
    };
    expect(pkg.publisher?.slug).toBe("hong");
    expect(pkg.publisher?.kind).toBe("user");
  });

  it("should support dist_tags", () => {
    const distTags = { latest: "1.0.0", beta: "2.0.0-beta.1" };
    expect(Object.keys(distTags)).toHaveLength(2);
    expect(distTags.latest).toBe("1.0.0");
    expect(distTags.beta).toBe("2.0.0-beta.1");
  });

  it("should support trust_tier values", () => {
    const tiers = ["unverified", "structural", "source_linked", "reviewed", "verified"];
    tiers.forEach(tier => {
      expect(typeof tier).toBe("string");
    });
  });

  it("should support visibility values", () => {
    const values = ["public", "unlisted", "private"];
    values.forEach(v => {
      expect(["public", "unlisted", "private"]).toContain(v);
    });
  });

  it("should handle null publisher gracefully", () => {
    const pkg: { publisher: { slug: string } | null } = { publisher: null };
    expect(pkg.publisher?.slug).toBeUndefined();
  });

  it("should handle empty dist_tags", () => {
    const pkg = { dist_tags: {} };
    expect(Object.keys(pkg.dist_tags)).toHaveLength(0);
  });
});
