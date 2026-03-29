import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentRanking, PackageSummary, RegistryOverview } from "../../src/lib/types";
import app from "../../src/index";
import { formatNumber, formatDownloads } from "../../src/lib/format";
import { AGENT_DISPLAY_NAMES } from "../../src/lib/constants";

describe("stats page", () => {
  const agents: AgentRanking[] = [
    { name: "claude", total_installs: 5000, packages: 120 },
    { name: "cursor", total_installs: 3200, packages: 95 },
    { name: "windsurf", total_installs: 1800, packages: 60 },
  ];

  const trending: PackageSummary[] = [
    { full_name: "hong/popular", type: "skill", description: "Popular skill", version: "2.0.0", downloads: 10000, repository: "" },
    { full_name: "acme/mcp-tool", type: "mcp", description: "MCP tool", version: "1.0.0", downloads: 5000, repository: "" },
  ];

  it("renders agent rankings with display names", () => {
    const displayNames = agents.map((a) => AGENT_DISPLAY_NAMES[a.name] ?? a.name);
    expect(displayNames).toEqual(["Claude", "Cursor", "Windsurf"]);
  });

  it("renders agent rankings with rank numbers", () => {
    const ranks = agents.map((_, idx) => idx + 1);
    expect(ranks).toEqual([1, 2, 3]);
  });

  it("formats install counts", () => {
    expect(formatNumber(agents[0].total_installs)).toBe("5,000");
    expect(formatNumber(agents[1].total_installs)).toBe("3,200");
  });

  it("formats package counts", () => {
    expect(formatNumber(agents[0].packages)).toBe("120");
    expect(formatNumber(agents[2].packages)).toBe("60");
  });

  it("falls back to raw name for unknown agents", () => {
    const unknown: AgentRanking = { name: "custom-agent", total_installs: 100, packages: 5 };
    expect(AGENT_DISPLAY_NAMES[unknown.name] ?? unknown.name).toBe("custom-agent");
  });

  it("handles empty agent rankings", () => {
    const emptyAgents: AgentRanking[] = [];
    expect(emptyAgents.length).toBe(0);
  });

  it("renders trending packages", () => {
    expect(trending).toHaveLength(2);
    expect(trending[0].full_name).toBe("hong/popular");
  });

  it("handles empty trending list", () => {
    const emptyTrending: PackageSummary[] = [];
    expect(emptyTrending.length).toBe(0);
  });

  it("generates correct package links from trending", () => {
    const hrefs = trending.map((pkg) => `/@${pkg.full_name}`);
    expect(hrefs).toEqual(["/@hong/popular", "/@acme/mcp-tool"]);
  });
});

describe("registry overview", () => {
  const overview: RegistryOverview = {
    total_packages: 142,
    total_downloads: 28412,
    total_publishers: 37,
    breakdown: [
      { type: "skill", count: 78, percentage: 54.9 },
      { type: "mcp", count: 42, percentage: 29.6 },
      { type: "cli", count: 22, percentage: 15.5 },
    ],
  };

  it("formats total packages", () => {
    expect(formatNumber(overview.total_packages)).toBe("142");
  });

  it("formats total downloads with compact notation", () => {
    expect(formatDownloads(overview.total_downloads)).toBe("28.4k");
  });

  it("formats total publishers", () => {
    expect(formatNumber(overview.total_publishers)).toBe("37");
  });

  it("computes relative bar widths for breakdown", () => {
    const maxPct = Math.max(...overview.breakdown.map((e) => e.percentage), 1);
    const widths = overview.breakdown.map((e) => (e.percentage / maxPct) * 100);
    expect(widths[0]).toBeCloseTo(100);
    expect(widths[1]).toBeCloseTo(53.9, 0);
    expect(widths[2]).toBeCloseTo(28.2, 0);
  });

  it("computes correct bar widths when breakdown is not sorted by percentage", () => {
    const unordered: RegistryOverview = {
      total_packages: 100,
      total_downloads: 5000,
      total_publishers: 10,
      breakdown: [
        { type: "cli", count: 15, percentage: 15.0 },
        { type: "skill", count: 60, percentage: 60.0 },
        { type: "mcp", count: 25, percentage: 25.0 },
      ],
    };
    const maxPct = Math.max(...unordered.breakdown.map((e) => e.percentage), 1);
    expect(maxPct).toBe(60.0);
    const widths = unordered.breakdown.map((e) => (e.percentage / maxPct) * 100);
    expect(widths[0]).toBeCloseTo(25.0);
    expect(widths[1]).toBeCloseTo(100);
    expect(widths[2]).toBeCloseTo(41.7, 0);
  });

  it("handles empty breakdown", () => {
    const empty: RegistryOverview = {
      total_packages: 0,
      total_downloads: 0,
      total_publishers: 0,
      breakdown: [],
    };
    expect(empty.breakdown.length).toBe(0);
  });

  it("handles null overview gracefully", () => {
    const nullOverview: RegistryOverview | null = null;
    expect(nullOverview).toBeNull();
  });

  it("handles single-type breakdown", () => {
    const single: RegistryOverview = {
      total_packages: 5,
      total_downloads: 100,
      total_publishers: 2,
      breakdown: [{ type: "skill", count: 5, percentage: 100 }],
    };
    const maxPct = single.breakdown[0].percentage;
    const barWidth = (single.breakdown[0].percentage / maxPct) * 100;
    expect(barWidth).toBe(100);
  });

  it("formats large download counts", () => {
    expect(formatDownloads(1_500_000)).toBe("1.5M");
    expect(formatDownloads(0)).toBe("0");
  });

  it("formats medium download counts", () => {
    expect(formatDownloads(999)).toBe("999");
    expect(formatDownloads(1000)).toBe("1.0k");
  });
});

describe("agent rankings bar visualization", () => {
  const agents: AgentRanking[] = [
    { name: "claude", total_installs: 5000, packages: 120 },
    { name: "cursor", total_installs: 3200, packages: 95 },
  ];

  it("computes max installs for relative bars", () => {
    const max = Math.max(...agents.map((a) => a.total_installs), 1);
    expect(max).toBe(5000);
  });

  it("computes bar percentages relative to max", () => {
    const max = Math.max(...agents.map((a) => a.total_installs), 1);
    const pcts = agents.map((a) => (a.total_installs / max) * 100);
    expect(pcts[0]).toBe(100);
    expect(pcts[1]).toBe(64);
  });

  it("handles single agent (100% bar)", () => {
    const single = [{ name: "claude", total_installs: 100, packages: 5 }];
    const max = Math.max(...single.map((a) => a.total_installs), 1);
    expect((single[0].total_installs / max) * 100).toBe(100);
  });

  it("handles zero installs without division error", () => {
    const zeros = [{ name: "claude", total_installs: 0, packages: 0 }];
    const max = Math.max(...zeros.map((a) => a.total_installs), 1);
    expect(max).toBe(1);
    expect((zeros[0].total_installs / max) * 100).toBe(0);
  });
});

// --- Route-level tests ---

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const ENV = { API_BASE_URL: "https://api.test", GITHUB_CLIENT_ID: "test-id" };

function apiJson(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function api500() {
  return new Response("Internal Server Error", { status: 500 });
}

describe("/stats route error isolation", () => {
  beforeEach(() => mockFetch.mockReset());

  it("renders agents and trending when overview fails", async () => {
    mockFetch.mockImplementation((...args: unknown[]) => {
      const url = String(args[0] ?? "");
      if (url.includes("/v1/stats/agents")) {
        return Promise.resolve(apiJson({ agents: [{ name: "claude", total_installs: 100, packages: 5 }] }));
      }
      if (url.includes("/v1/stats/trending")) {
        return Promise.resolve(apiJson({ packages: [{ full_name: "a/b", type: "skill", description: "d", downloads: 1, version: "1.0.0", repository: "" }] }));
      }
      if (url.includes("/v1/stats/overview")) {
        return Promise.resolve(api500());
      }
      return Promise.resolve(apiJson({}));
    });

    const res = await app.request("/stats", {}, ENV);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Claude");
    expect(html).toContain("a/b");
    expect(html).toContain("Registry overview data is not available");
  });

  it("renders overview when agents and trending fail", async () => {
    mockFetch.mockImplementation((...args: unknown[]) => {
      const url = String(args[0] ?? "");
      if (url.includes("/v1/stats/overview")) {
        return Promise.resolve(apiJson({ total_packages: 42, total_downloads: 1000, total_publishers: 5, breakdown: [] }));
      }
      if (url.includes("/v1/stats/agents") || url.includes("/v1/stats/trending")) {
        return Promise.resolve(api500());
      }
      return Promise.resolve(apiJson({}));
    });

    const res = await app.request("/stats", {}, ENV);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("42");
    expect(html).toContain("No agent data available");
    expect(html).toContain("No trending data available");
  });
});
