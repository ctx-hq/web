import { describe, it, expect } from "vitest";
import { AGENT_DISPLAY_NAMES } from "../../src/lib/constants";
import { formatNumber } from "../../src/lib/format";

// Test agent chart logic (pure function extraction, no JSX runtime needed)
describe("agent-chart", () => {
  type BreakdownEntry = { agent: string; count: number; percentage: number };

  function resolveBreakdown(breakdown: BreakdownEntry[] | null | undefined): BreakdownEntry[] | null {
    if (!breakdown || breakdown.length === 0) return null;
    return breakdown;
  }

  function formatEntry(entry: BreakdownEntry): { name: string; label: string; barWidth: string } {
    return {
      name: AGENT_DISPLAY_NAMES[entry.agent] ?? entry.agent,
      label: `${formatNumber(entry.count)} (${entry.percentage.toFixed(1)}%)`,
      barWidth: `${Math.min(entry.percentage, 100)}%`,
    };
  }

  it("returns null for empty breakdown", () => {
    expect(resolveBreakdown([])).toBeNull();
  });

  it("returns null for null breakdown", () => {
    expect(resolveBreakdown(null)).toBeNull();
  });

  it("returns null for undefined breakdown", () => {
    expect(resolveBreakdown(undefined)).toBeNull();
  });

  it("resolves known agent display names", () => {
    const entry = formatEntry({ agent: "claude", count: 150, percentage: 45.2 });
    expect(entry.name).toBe("Claude");
  });

  it("falls back to raw agent name for unknown agents", () => {
    const entry = formatEntry({ agent: "custom-agent", count: 10, percentage: 5.0 });
    expect(entry.name).toBe("custom-agent");
  });

  it("formats count and percentage correctly", () => {
    const entry = formatEntry({ agent: "cursor", count: 1234, percentage: 33.333 });
    expect(entry.label).toBe("1,234 (33.3%)");
  });

  it("clamps bar width to 100%", () => {
    const entry = formatEntry({ agent: "claude", count: 100, percentage: 120 });
    expect(entry.barWidth).toBe("100%");
  });

  it("handles zero percentage", () => {
    const entry = formatEntry({ agent: "claude", count: 0, percentage: 0 });
    expect(entry.label).toBe("0 (0.0%)");
    expect(entry.barWidth).toBe("0%");
  });

  it("handles multiple breakdown entries", () => {
    const data: BreakdownEntry[] = [
      { agent: "claude", count: 100, percentage: 50 },
      { agent: "cursor", count: 60, percentage: 30 },
      { agent: "windsurf", count: 40, percentage: 20 },
    ];
    const result = resolveBreakdown(data);
    expect(result).toHaveLength(3);
  });
});
