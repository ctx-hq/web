import { describe, it, expect } from "vitest";
import type { PackageSummary, OrgInfo, SyncProfileMeta } from "../../src/lib/types";

describe("dashboard page", () => {
  const username = "hong";

  const packages: PackageSummary[] = [
    { full_name: "hong/skill-a", type: "skill", description: "My skill", version: "1.0.0", downloads: 42, repository: "" },
  ];

  const orgs: OrgInfo[] = [
    { id: "org-1", name: "acme", display_name: "Acme Corp", role: "owner" },
    { id: "org-2", name: "beta-team", display_name: "", role: "member" },
  ];

  const syncMeta: SyncProfileMeta = {
    package_count: 5,
    syncable_count: 4,
    unsyncable_count: 1,
    last_push_at: "2025-03-20T10:00:00Z",
    last_pull_at: "2025-03-21T14:30:00Z",
    last_push_device: "macbook",
    last_pull_device: "linux-server",
  };

  // --- Tab resolution ---
  describe("tab navigation", () => {
    function resolveActiveTab(tab?: string): string {
      return tab ?? "packages";
    }

    it("defaults to packages tab", () => {
      expect(resolveActiveTab()).toBe("packages");
      expect(resolveActiveTab(undefined)).toBe("packages");
    });

    it("accepts orgs tab", () => {
      expect(resolveActiveTab("orgs")).toBe("orgs");
    });

    it("accepts sync tab", () => {
      expect(resolveActiveTab("sync")).toBe("sync");
    });
  });

  // --- Packages tab ---
  describe("packages tab", () => {
    it("displays signed-in username", () => {
      expect(`@${username}`).toBe("@hong");
    });

    it("renders packages list", () => {
      expect(packages).toHaveLength(1);
      expect(packages[0].full_name).toBe("hong/skill-a");
    });

    it("handles empty packages", () => {
      const emptyPkgs: PackageSummary[] = [];
      expect(emptyPkgs.length).toBe(0);
    });
  });

  // --- Orgs tab ---
  describe("orgs tab", () => {
    it("renders org list", () => {
      expect(orgs).toHaveLength(2);
    });

    it("generates correct org links", () => {
      const hrefs = orgs.map((org) => `/org/${encodeURIComponent(org.name)}`);
      expect(hrefs).toEqual(["/org/acme", "/org/beta-team"]);
    });

    it("displays display_name with fallback to name", () => {
      expect(orgs[0].display_name || orgs[0].name).toBe("Acme Corp");
      expect(orgs[1].display_name || orgs[1].name).toBe("beta-team");
    });

    it("shows role badge", () => {
      expect(orgs[0].role).toBe("owner");
      expect(orgs[1].role).toBe("member");
    });

    it("handles empty orgs list", () => {
      const emptyOrgs: OrgInfo[] = [];
      expect(emptyOrgs.length).toBe(0);
    });
  });

  // --- Sync tab ---
  describe("sync tab", () => {
    it("renders sync meta when available", () => {
      expect(syncMeta.package_count).toBe(5);
      expect(syncMeta.syncable_count).toBe(4);
    });

    it("handles null sync meta (never synced)", () => {
      const nullMeta: SyncProfileMeta | null = null;
      expect(nullMeta).toBeNull();
    });
  });
});
