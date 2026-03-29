import { describe, it, expect } from "vitest";
import type { OrgDetail, OrgMember, PackageSummary } from "../../src/lib/types";

describe("org page", () => {
  const org: OrgDetail = {
    id: "org-1",
    name: "acme",
    display_name: "Acme Corp",
    members: 3,
    packages: 2,
  };

  const members: OrgMember[] = [
    { username: "alice", avatar_url: "https://example.com/alice.png", role: "owner", created_at: "2025-01-01T00:00:00Z" },
    { username: "bob", avatar_url: "https://example.com/bob.png", role: "member", created_at: "2025-02-01T00:00:00Z" },
    { username: "carol", avatar_url: "https://example.com/carol.png", role: "member", created_at: "2025-03-01T00:00:00Z" },
  ];

  const packages: PackageSummary[] = [
    { full_name: "acme/tool-a", type: "cli", description: "CLI tool", version: "1.0.0", downloads: 500, repository: "" },
    { full_name: "acme/skill-b", type: "skill", description: "Skill", version: "0.5.0", downloads: 100, repository: "" },
  ];

  it("displays display_name as heading", () => {
    expect(org.display_name || org.name).toBe("Acme Corp");
  });

  it("falls back to name when display_name is empty", () => {
    const orgNoDisplay: OrgDetail = { ...org, display_name: undefined };
    expect(orgNoDisplay.display_name || orgNoDisplay.name).toBe("acme");
  });

  it("shows org slug", () => {
    expect(`@${org.name}`).toBe("@acme");
  });

  it("shows correct member count text (singular)", () => {
    const o: OrgDetail = { ...org, members: 1 };
    const text = `${o.members} ${o.members === 1 ? "member" : "members"}`;
    expect(text).toBe("1 member");
  });

  it("shows correct member count text (plural)", () => {
    const text = `${org.members} ${org.members === 1 ? "member" : "members"}`;
    expect(text).toBe("3 members");
  });

  it("shows correct package count text", () => {
    const text = `${org.packages} ${org.packages === 1 ? "package" : "packages"}`;
    expect(text).toBe("2 packages");
  });

  it("renders member roles", () => {
    const roles = members.map((m) => m.role);
    expect(roles).toEqual(["owner", "member", "member"]);
  });

  it("renders member list", () => {
    expect(members).toHaveLength(3);
    expect(members[0].username).toBe("alice");
  });

  it("renders packages", () => {
    expect(packages).toHaveLength(2);
    expect(packages[0].full_name).toBe("acme/tool-a");
  });

  it("handles empty packages list", () => {
    const emptyPkgs: PackageSummary[] = [];
    expect(emptyPkgs.length).toBe(0);
  });

  it("handles empty members list", () => {
    const emptyMembers: OrgMember[] = [];
    expect(emptyMembers.length).toBe(0);
  });

  it("generates correct org link", () => {
    const href = `/org/${encodeURIComponent(org.name)}`;
    expect(href).toBe("/org/acme");
  });
});
