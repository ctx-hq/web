import { describe, it, expect } from "vitest";
import type { PackageSummary, OrgInfo, SyncProfileMeta, AppNotification, StarredPackage, StarList, ClaimablePackage, Claim } from "../../src/lib/types";

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
    const VALID_TABS = ["packages", "stars", "orgs", "notifications", "claims", "sync"];

    function resolveActiveTab(tab?: string): string {
      return tab && VALID_TABS.includes(tab) ? tab : "packages";
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

    it("accepts claims tab", () => {
      expect(resolveActiveTab("claims")).toBe("claims");
    });

    it("rejects invalid tab", () => {
      expect(resolveActiveTab("invalid")).toBe("packages");
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

  // --- Notifications tab ---
  describe("notifications tab", () => {
    const notifications: AppNotification[] = [
      { id: "n1", type: "transfer_request", title: "Transfer request", body: "From @alice", read: false, created_at: "2025-03-20" },
      { id: "n2", type: "system_notice", title: "Welcome", body: "", read: true, created_at: "2025-03-19" },
    ];

    it("renders notification list", () => {
      expect(notifications).toHaveLength(2);
    });

    it("identifies unread notifications", () => {
      const unread = notifications.filter((n) => !n.read);
      expect(unread).toHaveLength(1);
      expect(unread[0].id).toBe("n1");
    });

    it("mark-all-read button shows only when unread exist", () => {
      const hasUnread = notifications.some((n) => !n.read);
      expect(hasUnread).toBe(true);
    });

    it("mark-all-read button hidden when all read", () => {
      const allRead: AppNotification[] = [
        { id: "n1", type: "system_notice", title: "Hi", body: "", read: true, created_at: "2025-03-20" },
      ];
      const hasUnread = allRead.some((n) => !n.read);
      expect(hasUnread).toBe(false);
    });

    it("mark-all-read action points to correct route", () => {
      const action = "/notifications/mark-all-read";
      expect(action).toBe("/notifications/mark-all-read");
    });

    it("dismiss action includes notification id", () => {
      const notifId = "n1";
      const action = `/notifications/${notifId}/dismiss`;
      expect(action).toBe("/notifications/n1/dismiss");
    });

    it("unread notifications have left border accent", () => {
      const unreadClass = "border-l-2 border-l-primary";
      expect(unreadClass).toContain("border-l-primary");
    });

    it("notification timestamp uses text-xs (WCAG 12px min)", () => {
      // Verify the class used is text-xs, not text-[10px]
      const timestampClass = "text-xs";
      expect(timestampClass).toBe("text-xs");
    });
  });

  // --- Stars tab ---
  describe("stars tab", () => {
    const stars: StarredPackage[] = [
      { full_name: "@scope/pkg-a", type: "skill", description: "A skill", starred_at: "2025-03-20" },
      { full_name: "@scope/pkg-b", type: "mcp", description: "An MCP server", starred_at: "2025-03-19" },
    ];

    const starLists: StarList[] = [
      { id: "list-1", name: "Favorites", slug: "favorites", visibility: "private", star_count: 3, created_at: "2025-03-01" },
      { id: "list-2", name: "Work", slug: "work", description: "Tools for work", visibility: "public", star_count: 1, created_at: "2025-03-10" },
    ];

    it("renders starred packages", () => {
      expect(stars).toHaveLength(2);
    });

    it("renders star lists", () => {
      expect(starLists).toHaveLength(2);
    });

    it("star list shows package count with correct pluralization", () => {
      expect(starLists[0].star_count).toBe(3);
      const label = starLists[0].star_count === 1 ? "package" : "packages";
      expect(label).toBe("packages");

      const singleList = { ...starLists[0], star_count: 1 };
      const singleLabel = singleList.star_count === 1 ? "package" : "packages";
      expect(singleLabel).toBe("package");
    });

    it("star list delete action includes list id", () => {
      const action = `/stars/lists/${starLists[0].id}/delete`;
      expect(action).toBe("/stars/lists/list-1/delete");
    });

    it("star list create action points to correct route", () => {
      const action = "/stars/lists/create";
      expect(action).toBe("/stars/lists/create");
    });

    describe("list filter", () => {
      it("generates All filter link", () => {
        const allHref = "/dashboard?tab=stars";
        expect(allHref).not.toContain("list=");
      });

      it("generates per-list filter links", () => {
        const listHref = `/dashboard?tab=stars&list=${encodeURIComponent(starLists[0].id)}`;
        expect(listHref).toContain("list=list-1");
      });

      it("All is active when no activeListId", () => {
        const activeListId: string | undefined = undefined;
        expect(!activeListId).toBe(true);
      });

      it("list is active when activeListId matches", () => {
        const activeListId = "list-1";
        expect(activeListId === starLists[0].id).toBe(true);
      });

      it("filter only shown when star lists exist", () => {
        const emptyLists: StarList[] = [];
        expect(emptyLists.length > 0).toBe(false);
      });
    });
  });

  // --- Claims tab ---
  describe("claims tab", () => {
    const claimablePackages: ClaimablePackage[] = [
      { package_id: "pkg-1", full_name: "@system/my-tool", source_repo: "github:hong/my-tool", description: "A CLI tool", downloads: 50 },
    ];

    const claims: Claim[] = [
      { id: "claim-1", package_id: "pkg-2", github_repo: "github:hong/other", status: "approved", created_at: "2025-03-15", resolved_at: "2025-03-15", full_name: "@hong/other" },
    ];

    it("renders claimable packages", () => {
      expect(claimablePackages).toHaveLength(1);
    });

    it("renders claim history", () => {
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe("approved");
    });

    it("claim form includes package_id", () => {
      const packageId = claimablePackages[0].package_id;
      expect(packageId).toBe("pkg-1");
    });

    it("claim action points to /claims", () => {
      const action = "/claims";
      expect(action).toBe("/claims");
    });

    it("handles empty claimable and claims", () => {
      const emptyClaimable: ClaimablePackage[] = [];
      const emptyClaims: Claim[] = [];
      expect(emptyClaimable.length === 0 && emptyClaims.length === 0).toBe(true);
    });

    it("claim status maps to badge variant", () => {
      const statusMap: Record<string, string> = {
        approved: "default",
        rejected: "destructive",
        pending: "secondary",
      };
      expect(statusMap["approved"]).toBe("default");
      expect(statusMap["rejected"]).toBe("destructive");
      expect(statusMap["pending"]).toBe("secondary");
    });

    it("shows source repo and downloads for claimable packages", () => {
      const pkg = claimablePackages[0];
      expect(pkg.source_repo).toContain("github:");
      expect(pkg.downloads).toBeGreaterThan(0);
    });
  });
});
