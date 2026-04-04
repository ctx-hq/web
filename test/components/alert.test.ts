import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const CSS = readFileSync(
  resolve(__dirname, "../../src/styles/globals.css"),
  "utf-8",
);

const SRC_DIR = resolve(__dirname, "../../src");

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

describe("alert component classes", () => {
  const variants = ["destructive", "success", "warning", "info"] as const;

  it("each variant is defined in globals.css", () => {
    for (const variant of variants) {
      expect(CSS).toContain(`.cn-alert-${variant}`);
    }
  });

  it("cn-alert base uses semantic layout (flex, gap, border, padding)", () => {
    const alertMatch = CSS.match(/\.cn-alert\s*\{[^}]+\}/);
    expect(alertMatch).not.toBeNull();
    const alertDef = alertMatch![0];
    expect(alertDef).toContain("flex");
    expect(alertDef).toContain("gap");
    expect(alertDef).toContain("border");
    expect(alertDef).toContain("text-sm");
  });

  it("success variant uses success token (not hardcoded green)", () => {
    const match = CSS.match(/\.cn-alert-success\s*\{[^}]+\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("success");
    expect(match![0]).not.toMatch(/green-\d/);
  });

  it("warning variant uses warning token (not hardcoded amber/yellow)", () => {
    const match = CSS.match(/\.cn-alert-warning\s*\{[^}]+\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("warning");
    expect(match![0]).not.toMatch(/(amber|yellow)-\d/);
  });

  it("info variant uses info token (not hardcoded blue)", () => {
    const match = CSS.match(/\.cn-alert-info\s*\{[^}]+\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("info");
    expect(match![0]).not.toMatch(/blue-\d/);
  });
});

describe("alert usage in source files", () => {
  const allTsx = [
    ...collectFiles(join(SRC_DIR, "pages"), ".tsx"),
    ...collectFiles(join(SRC_DIR, "components"), ".tsx"),
  ];

  it("every cn-alert-* usage is paired with cn-alert base class", () => {
    for (const file of allTsx) {
      const content = readFileSync(file, "utf-8");
      const relPath = file.replace(SRC_DIR + "/", "");
      // Find class strings containing cn-alert-variant but check cn-alert base is present
      const classAttrs = content.match(/class="([^"]*)cn-alert-(?:destructive|success|warning|info)([^"]*)"/g) || [];
      for (const attr of classAttrs) {
        expect(attr, `${relPath}: cn-alert-* used without cn-alert base`).toContain("cn-alert ");
      }
    }
  });

  it("no source file uses deprecated cn-form-banner-* classes", () => {
    for (const file of allTsx) {
      const content = readFileSync(file, "utf-8");
      const relPath = file.replace(SRC_DIR + "/", "");
      expect(
        content.match(/cn-form-banner-/),
        `${relPath} still uses deprecated cn-form-banner-*`,
      ).toBeNull();
    }
  });
});
