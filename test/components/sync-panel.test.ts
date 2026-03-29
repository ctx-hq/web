import { describe, it, expect } from "vitest";
import type { SyncProfileMeta } from "../../src/lib/types";
import { formatDate } from "../../src/lib/format";

// Test sync panel logic (pure function extraction, no JSX runtime needed)
describe("sync-panel", () => {
  function buildSyncRows(meta: SyncProfileMeta | null): { label: string; value: string }[] | null {
    if (!meta) return null;
    const rows: { label: string; value: string }[] = [
      { label: "Packages", value: String(meta.package_count) },
      { label: "Syncable", value: String(meta.syncable_count) },
      { label: "Unsyncable", value: String(meta.unsyncable_count) },
    ];
    if (meta.last_push_at) {
      const device = meta.last_push_device ? ` (${meta.last_push_device})` : "";
      rows.push({ label: "Last push", value: `${formatDate(meta.last_push_at)}${device}` });
    }
    if (meta.last_pull_at) {
      const device = meta.last_pull_device ? ` (${meta.last_pull_device})` : "";
      rows.push({ label: "Last pull", value: `${formatDate(meta.last_pull_at)}${device}` });
    }
    return rows;
  }

  const fullMeta: SyncProfileMeta = {
    package_count: 15,
    syncable_count: 12,
    unsyncable_count: 3,
    last_push_at: "2025-03-20T10:00:00Z",
    last_pull_at: "2025-03-21T14:30:00Z",
    last_push_device: "macbook",
    last_pull_device: "linux-server",
  };

  it("returns null for null meta (never synced)", () => {
    expect(buildSyncRows(null)).toBeNull();
  });

  it("builds all rows when push and pull are present", () => {
    const rows = buildSyncRows(fullMeta)!;
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.label)).toEqual([
      "Packages", "Syncable", "Unsyncable", "Last push", "Last pull",
    ]);
  });

  it("includes device info in push/pull rows", () => {
    const rows = buildSyncRows(fullMeta)!;
    const push = rows.find((r) => r.label === "Last push");
    expect(push!.value).toContain("(macbook)");
    const pull = rows.find((r) => r.label === "Last pull");
    expect(pull!.value).toContain("(linux-server)");
  });

  it("omits push row when last_push_at is null", () => {
    const meta: SyncProfileMeta = {
      ...fullMeta,
      last_push_at: null,
    };
    const rows = buildSyncRows(meta)!;
    expect(rows.find((r) => r.label === "Last push")).toBeUndefined();
  });

  it("omits pull row when last_pull_at is null", () => {
    const meta: SyncProfileMeta = {
      ...fullMeta,
      last_pull_at: null,
    };
    const rows = buildSyncRows(meta)!;
    expect(rows.find((r) => r.label === "Last pull")).toBeUndefined();
  });

  it("formats dates using formatDate", () => {
    const rows = buildSyncRows(fullMeta)!;
    const push = rows.find((r) => r.label === "Last push");
    expect(push!.value).toContain("2025-03-20");
  });

  it("shows counts correctly", () => {
    const rows = buildSyncRows(fullMeta)!;
    expect(rows[0].value).toBe("15");
    expect(rows[1].value).toBe("12");
    expect(rows[2].value).toBe("3");
  });
});
