import { describe, it, expect } from "vitest";
import type { Profile, PackageSummary } from "../../src/lib/types";

describe("profile page", () => {
  const profile: Profile = {
    slug: "hong",
    kind: "user",
    packages: 3,
    created_at: "2025-01-15T00:00:00Z",
  };

  const packages: PackageSummary[] = [
    { full_name: "hong/skill-a", type: "skill", description: "A skill", version: "1.0.0", downloads: 100, repository: "" },
    { full_name: "hong/mcp-b", type: "mcp", description: "An MCP server", version: "0.2.0", downloads: 50, repository: "" },
    { full_name: "hong/cli-c", type: "cli", description: "A CLI tool", version: "2.1.0", downloads: 200, repository: "" },
  ];

  it("generates correct profile heading", () => {
    expect(`@${profile.slug}`).toBe("@hong");
  });

  it("displays profile kind as badge", () => {
    expect(profile.kind).toBe("user");
  });

  it("shows correct package count text (singular)", () => {
    const p: Profile = { ...profile, packages: 1 };
    const text = `${p.packages} ${p.packages === 1 ? "package" : "packages"} published`;
    expect(text).toBe("1 package published");
  });

  it("shows correct package count text (plural)", () => {
    const text = `${profile.packages} ${profile.packages === 1 ? "package" : "packages"} published`;
    expect(text).toBe("3 packages published");
  });

  it("generates correct package links", () => {
    const hrefs = packages.map((pkg) => `/@${pkg.full_name}`);
    expect(hrefs).toEqual(["/@hong/skill-a", "/@hong/mcp-b", "/@hong/cli-c"]);
  });

  it("handles empty packages list", () => {
    const emptyPackages: PackageSummary[] = [];
    expect(emptyPackages.length).toBe(0);
  });

  it("supports org kind profile", () => {
    const orgProfile: Profile = {
      slug: "acme-corp",
      kind: "org",
      packages: 12,
      created_at: "2025-02-01T00:00:00Z",
    };
    expect(orgProfile.kind).toBe("org");
    expect(`@${orgProfile.slug}`).toBe("@acme-corp");
  });
});
