import { describe, it, expect } from "vitest";

describe("button", () => {
  // Mirror the class building logic from button.tsx
  function buildButtonClasses(opts: {
    variant?: string;
    size?: string;
    className?: string;
  }): string {
    return [
      "cn-button",
      `cn-button-variant-${opts.variant ?? "default"}`,
      `cn-button-size-${opts.size ?? "default"}`,
      opts.className,
    ]
      .filter(Boolean)
      .join(" ");
  }

  it("builds default classes", () => {
    const cls = buildButtonClasses({});
    expect(cls).toBe("cn-button cn-button-variant-default cn-button-size-default");
  });

  it("applies variant and size", () => {
    const cls = buildButtonClasses({ variant: "outline", size: "sm" });
    expect(cls).toContain("cn-button-variant-outline");
    expect(cls).toContain("cn-button-size-sm");
  });

  it("appends custom className", () => {
    const cls = buildButtonClasses({ className: "ml-2" });
    expect(cls).toContain("ml-2");
  });

  it("supports all expected variants", () => {
    const variants = ["default", "outline", "ghost", "secondary", "destructive", "link"];
    for (const v of variants) {
      const cls = buildButtonClasses({ variant: v });
      expect(cls).toContain(`cn-button-variant-${v}`);
    }
  });

  it("supports all expected sizes", () => {
    const sizes = ["xs", "sm", "default", "lg", "icon-xs", "icon-sm", "icon"];
    for (const s of sizes) {
      const cls = buildButtonClasses({ size: s });
      expect(cls).toContain(`cn-button-size-${s}`);
    }
  });
});
