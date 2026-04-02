import { describe, it, expect } from "vitest";
import { parseManifest } from "../../src/lib/types";
import type {
  ManifestInfo, PackageSummary, PackageDetail, VersionSummary, VersionDetail,
  SearchResult, OrgInfo, OrgDetail, OrgMember, PackageStats, AgentRanking,
  SyncProfileMeta, SyncPackageEntry, Profile,
} from "../../src/lib/types";

describe("parseManifest", () => {
  it("parses valid manifest JSON", () => {
    const raw = JSON.stringify({
      source: { github: "https://github.com/test/repo", path: "src", ref: "main" },
      skill: { entry: "index.ts", tags: ["ai", "tool"] },
    });
    const result = parseManifest(raw);
    expect(result).not.toBeNull();
    expect(result!.source!.github).toBe("https://github.com/test/repo");
    expect(result!.skill!.tags).toEqual(["ai", "tool"]);
  });

  it("parses manifest with mcp fields", () => {
    const raw = JSON.stringify({
      mcp: { transport: "stdio", command: "node server.js", tools: ["search", "fetch"] },
    });
    const result = parseManifest(raw);
    expect(result).not.toBeNull();
    expect(result!.mcp!.transport).toBe("stdio");
    expect(result!.mcp!.tools).toEqual(["search", "fetch"]);
  });

  it("parses manifest with cli fields", () => {
    const raw = JSON.stringify({
      cli: { binary: "my-tool", verify: "sha256", compatible: ">=18" },
      install: { brew: "my-tool", npm: "my-tool" },
    });
    const result = parseManifest(raw);
    expect(result!.cli!.binary).toBe("my-tool");
    expect(result!.install!.brew).toBe("my-tool");
  });

  it("returns null for undefined input", () => {
    expect(parseManifest(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseManifest("")).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseManifest("{invalid json}")).toBeNull();
  });

  it("returns empty object for valid empty JSON", () => {
    const result = parseManifest("{}");
    expect(result).toEqual({});
  });

  it("parses manifest with upstream fields", () => {
    const raw = JSON.stringify({
      upstream: { npm: "@playwright/mcp", tracking: "npm", version_pattern: "*" },
    });
    const result = parseManifest(raw);
    expect(result!.upstream!.npm).toBe("@playwright/mcp");
    expect(result!.upstream!.tracking).toBe("npm");
  });

  it("parses manifest with mcp transports and require", () => {
    const raw = JSON.stringify({
      mcp: {
        transport: "stdio",
        command: "docker",
        require: { bins: ["docker"], min_versions: { docker: "20.0.0" } },
        hooks: { post_install: [{ command: "npx", args: ["playwright", "install"], description: "Install browser" }] },
        transports: [
          { id: "remote", label: "Remote", transport: "streamable-http", url: "https://api.example.com/mcp/" },
        ],
      },
    });
    const result = parseManifest(raw);
    expect(result!.mcp!.require!.bins).toEqual(["docker"]);
    expect(result!.mcp!.hooks!.post_install).toHaveLength(1);
    expect(result!.mcp!.hooks!.post_install![0].command).toBe("npx");
    expect(result!.mcp!.transports).toHaveLength(1);
    expect(result!.mcp!.transports![0].id).toBe("remote");
    expect(result!.mcp!.transports![0].url).toBe("https://api.example.com/mcp/");
  });
});

describe("type interfaces compile correctly", () => {
  it("PackageSummary includes trust_tier and owner_slug", () => {
    const pkg: PackageSummary = {
      full_name: "test/pkg",
      type: "skill",
      description: "test",
      version: "1.0.0",
      downloads: 0,
      repository: "",
      trust_tier: "verified",
      owner_slug: "test-owner",
    };
    expect(pkg.trust_tier).toBe("verified");
    expect(pkg.owner_slug).toBe("test-owner");
  });

  it("PackageDetail includes all optional fields", () => {
    const detail: PackageDetail = {
      full_name: "test/pkg",
      type: "mcp",
      description: "test",
      license: "MIT",
      repository: "",
      keywords: [],
      platforms: [],
      downloads: 0,
      trust_tier: "structural",
      visibility: "unlisted",
      owner: { slug: "hong", kind: "user" },
      dist_tags: { latest: "1.0.0" },
      versions: [],
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    };
    expect(detail.visibility).toBe("unlisted");
    expect(detail.owner!.slug).toBe("hong");
  });

  it("OrgDetail extends OrgInfo with members and packages", () => {
    const org: OrgDetail = {
      id: "org-1",
      name: "test-org",
      display_name: "Test Organization",
      members: 5,
      packages: 10,
    };
    expect(org.members).toBe(5);
    expect(org.packages).toBe(10);
  });

  it("SyncProfileMeta has nullable push/pull dates", () => {
    const meta: SyncProfileMeta = {
      package_count: 0,
      syncable_count: 0,
      unsyncable_count: 0,
      last_push_at: null,
      last_pull_at: null,
      last_push_device: "",
      last_pull_device: "",
    };
    expect(meta.last_push_at).toBeNull();
    expect(meta.last_pull_at).toBeNull();
  });

  it("Profile has kind union type", () => {
    const user: Profile = { slug: "hong", kind: "user", packages: 5, created_at: "2025-01-01T00:00:00Z" };
    const org: Profile = { slug: "acme", kind: "org", packages: 20, created_at: "2025-01-01T00:00:00Z" };
    expect(user.kind).toBe("user");
    expect(org.kind).toBe("org");
  });
});
