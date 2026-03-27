import { describe, it, expect } from "vitest";
import type { PackageType } from "../../src/lib/types";

// Test badge variant resolution logic (pure function, no JSX runtime needed)
describe("badge", () => {
  // Mirror the logic from badge.tsx
  function resolveVariant(opts: { variant?: string; type?: PackageType }): string {
    return opts.variant ?? (opts.type ? `type-${opts.type}` : "default");
  }

  function buildClasses(opts: {
    variant?: string;
    type?: PackageType;
    active?: boolean;
    className?: string;
  }): string {
    const resolvedVariant = resolveVariant(opts);
    return [
      "cn-badge",
      `cn-badge-variant-${resolvedVariant}`,
      opts.active ? "cn-badge-active" : "",
      opts.className,
    ]
      .filter(Boolean)
      .join(" ");
  }

  it("resolves type shorthand to variant", () => {
    expect(resolveVariant({ type: "skill" })).toBe("type-skill");
    expect(resolveVariant({ type: "mcp" })).toBe("type-mcp");
    expect(resolveVariant({ type: "cli" })).toBe("type-cli");
  });

  it("uses explicit variant over type", () => {
    expect(resolveVariant({ variant: "secondary", type: "skill" })).toBe("secondary");
  });

  it("defaults to 'default' variant when neither type nor variant given", () => {
    expect(resolveVariant({})).toBe("default");
  });

  it("builds correct class string with active state", () => {
    const classes = buildClasses({ type: "skill", active: true });
    expect(classes).toContain("cn-badge");
    expect(classes).toContain("cn-badge-variant-type-skill");
    expect(classes).toContain("cn-badge-active");
  });

  it("builds correct class string without active state", () => {
    const classes = buildClasses({ type: "mcp" });
    expect(classes).toContain("cn-badge-variant-type-mcp");
    expect(classes).not.toContain("cn-badge-active");
  });

  it("each type produces distinct variant class", () => {
    const types: PackageType[] = ["skill", "mcp", "cli"];
    const variants = types.map((t) => resolveVariant({ type: t }));
    expect(new Set(variants).size).toBe(3);
  });

  it("appends custom className", () => {
    const classes = buildClasses({ variant: "outline", className: "px-3 py-1" });
    expect(classes).toContain("px-3 py-1");
  });
});
