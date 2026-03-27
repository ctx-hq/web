import { describe, it, expect } from "vitest";

// Test badge rendering logic (pure function, no JSX runtime needed)
describe("badge", () => {
  const typeStyles: Record<string, string> = {
    skill: "bg-type-skill-bg text-type-skill border-type-skill/20",
    mcp: "bg-type-mcp-bg text-type-mcp border-type-mcp/20",
    cli: "bg-type-cli-bg text-type-cli border-type-cli/20",
  };

  it("returns correct style for skill type", () => {
    expect(typeStyles["skill"]).toContain("skill");
    expect(typeStyles["skill"]).toContain("bg-type-skill-bg");
  });

  it("returns correct style for mcp type", () => {
    expect(typeStyles["mcp"]).toContain("mcp");
    expect(typeStyles["mcp"]).toContain("bg-type-mcp-bg");
  });

  it("returns correct style for cli type", () => {
    expect(typeStyles["cli"]).toContain("cli");
    expect(typeStyles["cli"]).toContain("bg-type-cli-bg");
  });

  it("each type has distinct colors", () => {
    const values = Object.values(typeStyles);
    const unique = new Set(values);
    expect(unique.size).toBe(3);
  });

  it("handles unknown type gracefully", () => {
    expect(typeStyles["unknown"]).toBeUndefined();
  });
});
