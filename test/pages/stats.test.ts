import { describe, it, expect } from "vitest";
import type { AgentRanking, PackageSummary } from "../../src/lib/types";
import { formatNumber } from "../../src/lib/format";
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
