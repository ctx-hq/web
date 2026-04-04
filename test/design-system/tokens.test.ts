import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CSS = readFileSync(
  resolve(__dirname, "../../src/styles/globals.css"),
  "utf-8",
);

/* ----------------------------------------------------------------
   OKLCH → WCAG relative luminance conversion
   ---------------------------------------------------------------- */

/** Parse "oklch(L C H)" from a CSS variable declaration. */
function parseOklch(css: string, varName: string): { L: number; C: number; H: number } | null {
  const re = new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*oklch\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\)`);
  const m = css.match(re);
  if (!m) return null;
  return { L: parseFloat(m[1]), C: parseFloat(m[2]), H: parseFloat(m[3]) };
}

/** Convert OKLab to linear sRGB. */
function oklabToLinearRGB(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

/** WCAG 2.x relative luminance from linear sRGB. */
function relativeLuminance(R: number, G: number, B: number): number {
  return 0.2126 * Math.max(0, R) + 0.7152 * Math.max(0, G) + 0.0722 * Math.max(0, B);
}

/** Contrast ratio between two relative luminance values. */
function contrastRatio(y1: number, y2: number): number {
  const [lighter, darker] = y1 > y2 ? [y1, y2] : [y2, y1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** Get WCAG contrast ratio of an OKLCH color against white. */
function contrastAgainstWhite(oklch: { L: number; C: number; H: number }): number {
  const hRad = (oklch.H * Math.PI) / 180;
  const a = oklch.C * Math.cos(hRad);
  const b = oklch.C * Math.sin(hRad);
  const [R, G, B] = oklabToLinearRGB(oklch.L, a, b);
  const Y = relativeLuminance(R, G, B);
  return contrastRatio(1.0, Y); // white Y = 1.0
}

/** Get WCAG contrast ratio of an OKLCH color against dark background. */
function contrastAgainstDark(oklch: { L: number; C: number; H: number }, bgY = 0.03): number {
  const hRad = (oklch.H * Math.PI) / 180;
  const a = oklch.C * Math.cos(hRad);
  const b = oklch.C * Math.sin(hRad);
  const [R, G, B] = oklabToLinearRGB(oklch.L, a, b);
  const Y = relativeLuminance(R, G, B);
  return contrastRatio(Y, bgY);
}

/* ----------------------------------------------------------------
   Token existence tests
   ---------------------------------------------------------------- */

describe("design tokens: semantic status", () => {
  const statusTokens = [
    "success", "success-foreground",
    "warning", "warning-foreground",
    "info", "info-foreground",
  ];

  for (const token of statusTokens) {
    it(`defines --color-${token} in light theme`, () => {
      expect(CSS).toContain(`--color-${token}:`);
    });
  }

  it("defines status tokens in dark theme", () => {
    const darkBlock = CSS.slice(CSS.indexOf(".dark {"));
    for (const token of statusTokens) {
      expect(darkBlock).toContain(`--color-${token}:`);
    }
  });
});

describe("design tokens: trust tiers", () => {
  const trustTokens = [
    "trust-structural", "trust-source-linked",
    "trust-reviewed", "trust-verified",
  ];

  for (const token of trustTokens) {
    it(`defines --color-${token} in light theme`, () => {
      expect(CSS).toContain(`--color-${token}:`);
    });
  }

  it("defines trust tokens in dark theme", () => {
    const darkBlock = CSS.slice(CSS.indexOf(".dark {"));
    for (const token of trustTokens) {
      expect(darkBlock).toContain(`--color-${token}:`);
    }
  });
});

describe("design tokens: interactive states", () => {
  it("defines --color-star", () => {
    expect(CSS).toContain("--color-star:");
  });

  it("defines --color-border-hover", () => {
    expect(CSS).toContain("--color-border-hover:");
  });
});

/* ----------------------------------------------------------------
   Component class existence tests
   ---------------------------------------------------------------- */

describe("component classes: cn-alert", () => {
  const variants = ["destructive", "success", "warning", "info"];

  it("defines .cn-alert base class", () => {
    expect(CSS).toContain(".cn-alert {");
  });

  for (const variant of variants) {
    it(`defines .cn-alert-${variant}`, () => {
      expect(CSS).toContain(`.cn-alert-${variant} {`);
    });
  }
});

describe("component classes: cn-dialog", () => {
  const classes = [
    "cn-dialog", "cn-dialog-body", "cn-dialog-title",
    "cn-dialog-title-destructive", "cn-dialog-description", "cn-dialog-actions",
  ];

  for (const cls of classes) {
    it(`defines .${cls}`, () => {
      expect(CSS).toContain(`.${cls} {`);
    });
  }
});

describe("component classes: badge variants", () => {
  it("defines .cn-badge-variant-warning", () => {
    expect(CSS).toContain(".cn-badge-variant-warning {");
  });

  it("defines .cn-badge-variant-info", () => {
    expect(CSS).toContain(".cn-badge-variant-info {");
  });
});

/* ----------------------------------------------------------------
   Light/dark symmetry
   ---------------------------------------------------------------- */

describe("light/dark token symmetry", () => {
  it("every custom token in @theme has a .dark override", () => {
    const themeBlock = CSS.slice(
      CSS.indexOf("@theme {"),
      CSS.indexOf("}", CSS.indexOf("@theme {")) + 1,
    );
    const darkBlock = CSS.slice(CSS.indexOf(".dark {"));

    const semanticTokens = [
      "success", "success-foreground",
      "warning", "warning-foreground",
      "info", "info-foreground",
      "trust-structural", "trust-source-linked", "trust-reviewed", "trust-verified",
      "star", "border-hover",
    ];

    for (const token of semanticTokens) {
      expect(themeBlock).toContain(`--color-${token}:`);
      expect(darkBlock).toContain(`--color-${token}:`);
    }
  });
});

/* ----------------------------------------------------------------
   WCAG AA contrast ratio (4.5:1) for text-grade tokens
   ---------------------------------------------------------------- */

describe("WCAG AA contrast: light theme text tokens against white", () => {
  // Extract the light theme block (from :root to .dark)
  const lightBlock = CSS.slice(0, CSS.indexOf(".dark {"));

  const textTokens = [
    "--color-success",
    "--color-warning",
    "--color-info",
    "--color-trust-structural",
    "--color-trust-source-linked",
    "--color-trust-reviewed",
    "--color-trust-verified",
    "--color-star",
  ];

  for (const token of textTokens) {
    it(`${token} passes 4.5:1 against white`, () => {
      const oklch = parseOklch(lightBlock, token);
      expect(oklch, `${token} not found or not oklch`).not.toBeNull();
      const ratio = contrastAgainstWhite(oklch!);
      expect(
        ratio,
        `${token} contrast ${ratio.toFixed(2)}:1 < 4.5:1 (L=${oklch!.L}, C=${oklch!.C}, H=${oklch!.H})`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("WCAG AA contrast: dark theme text tokens against dark bg", () => {
  const darkBlock = CSS.slice(CSS.indexOf(".dark {"));

  const textTokens = [
    "--color-success",
    "--color-warning",
    "--color-info",
    "--color-trust-structural",
    "--color-trust-source-linked",
    "--color-trust-reviewed",
    "--color-trust-verified",
    "--color-star",
  ];

  for (const token of textTokens) {
    it(`${token} passes 4.5:1 against dark background`, () => {
      const oklch = parseOklch(darkBlock, token);
      expect(oklch, `${token} not found or not oklch`).not.toBeNull();
      // Dark theme background ~oklch(0.20) ≈ Y 0.03
      const ratio = contrastAgainstDark(oklch!, 0.03);
      expect(
        ratio,
        `${token} contrast ${ratio.toFixed(2)}:1 < 4.5:1 (L=${oklch!.L}, C=${oklch!.C}, H=${oklch!.H})`,
      ).toBeGreaterThanOrEqual(4.5);
    });
  }
});
