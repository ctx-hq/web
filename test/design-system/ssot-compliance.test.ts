import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

/**
 * SSOT Compliance Test
 *
 * Ensures that source files (pages, components) do not contain
 * hardcoded Tailwind color classes that should use design tokens.
 */

const SRC_DIR = resolve(__dirname, "../../src");

/** Recursively collect all .tsx files from a directory. */
function collectFiles(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectFiles(full, ext));
    } else if (full.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/** Hardcoded color patterns that indicate SSOT violations. */
const FORBIDDEN_PATTERNS = [
  // Hardcoded status colors (should use success/warning/info/destructive tokens)
  /\btext-(green|emerald)-\d{2,3}\b/,
  /\bbg-(green|emerald)-\d{2,3}\b/,
  /\bborder-(green|emerald)-\d{2,3}\b/,
  /\btext-red-\d{2,3}\b/,
  /\bbg-red-\d{2,3}\b/,
  /\bborder-red-\d{2,3}\b/,
  /\btext-(amber|yellow)-\d{2,3}\b/,
  /\bbg-(amber|yellow)-\d{2,3}\b/,
  /\bborder-(amber|yellow)-\d{2,3}\b/,
  /\btext-blue-\d{2,3}\b/,
  /\bbg-blue-\d{2,3}\b/,
  /\bborder-blue-\d{2,3}\b/,
];

describe("SSOT: no hardcoded colors in pages", () => {
  const pages = collectFiles(join(SRC_DIR, "pages"), ".tsx");

  for (const file of pages) {
    const relPath = file.replace(SRC_DIR + "/", "");
    const content = readFileSync(file, "utf-8");

    it(`${relPath} uses design tokens instead of hardcoded colors`, () => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = content.match(pattern);
        expect(
          match,
          `Found hardcoded color "${match?.[0]}" in ${relPath}. Use design token instead.`,
        ).toBeNull();
      }
    });
  }
});

describe("SSOT: no hardcoded colors in components", () => {
  const components = collectFiles(join(SRC_DIR, "components"), ".tsx");

  for (const file of components) {
    const relPath = file.replace(SRC_DIR + "/", "");
    const content = readFileSync(file, "utf-8");

    it(`${relPath} uses design tokens instead of hardcoded colors`, () => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = content.match(pattern);
        expect(
          match,
          `Found hardcoded color "${match?.[0]}" in ${relPath}. Use design token instead.`,
        ).toBeNull();
      }
    });
  }
});

describe("SSOT: no hardcoded colors in constants", () => {
  const file = join(SRC_DIR, "lib/constants.ts");
  const content = readFileSync(file, "utf-8");

  it("constants.ts uses design tokens for trust tier colors", () => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      const match = content.match(pattern);
      expect(
        match,
        `Found hardcoded color "${match?.[0]}" in constants.ts. Use design token instead.`,
      ).toBeNull();
    }
  });
});

describe("SSOT: dialog elements use cn-dialog class", () => {
  const allTsx = [
    ...collectFiles(join(SRC_DIR, "pages"), ".tsx"),
    ...collectFiles(join(SRC_DIR, "components"), ".tsx"),
  ];

  for (const file of allTsx) {
    const relPath = file.replace(SRC_DIR + "/", "");
    const content = readFileSync(file, "utf-8");

    // Only check files that contain <dialog
    if (!content.includes("<dialog")) continue;

    it(`${relPath} dialog elements use cn-dialog class`, () => {
      // Find all dialog class attributes
      const dialogMatches = content.match(/<dialog[^>]*class="([^"]*)"/g) || [];
      for (const match of dialogMatches) {
        expect(match).toContain("cn-dialog");
      }
    });
  }
});
