import { describe, it, expect } from "vitest";
import { PLACEHOLDER_BY_TYPE, PACKAGE_TYPES } from "../../src/lib/constants";

describe("search-box", () => {
  it("has default placeholder for empty type", () => {
    expect(PLACEHOLDER_BY_TYPE[""]).toBe("Search skills, MCP servers, CLI tools...");
  });

  it("has placeholder for skill type", () => {
    expect(PLACEHOLDER_BY_TYPE["skill"]).toBe("Search skills...");
  });

  it("has placeholder for mcp type", () => {
    expect(PLACEHOLDER_BY_TYPE["mcp"]).toBe("Search MCP servers...");
  });

  it("has placeholder for cli type", () => {
    expect(PLACEHOLDER_BY_TYPE["cli"]).toBe("Search CLI tools...");
  });

  it("has placeholder for all package types", () => {
    for (const t of PACKAGE_TYPES) {
      expect(PLACEHOLDER_BY_TYPE[t]).toBeDefined();
      expect(PLACEHOLDER_BY_TYPE[t].length).toBeGreaterThan(0);
    }
  });

  it("all placeholders are distinct", () => {
    const values = [PLACEHOLDER_BY_TYPE[""], ...PACKAGE_TYPES.map((t) => PLACEHOLDER_BY_TYPE[t])];
    expect(new Set(values).size).toBe(values.length);
  });
});
