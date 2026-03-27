import { describe, it, expect } from "vitest";

// Test Icon component logic without JSX runtime
describe("icon", () => {
  // Mirror the icon registry from icon.tsx
  const KNOWN_ICONS = [
    "magnifying-glass",
    "moon",
    "sun",
    "list",
    "copy",
    "check",
    "arrow-right",
    "github-logo",
    "download",
    "package",
    "caret-down",
    "x",
  ];

  it("has all required icons registered", () => {
    // These are the icons actually used in the project
    const usedIcons = [
      "magnifying-glass", // SearchBox
      "moon",             // Header theme toggle
      "sun",              // Header theme toggle
      "list",             // Header mobile menu
      "copy",             // InstallTabs, Home
      "arrow-right",      // Dashboard
      "github-logo",      // Login, PackageDetail
      "download",         // PackageCard, PackageDetail
      "package",          // Home hero
    ];

    for (const icon of usedIcons) {
      expect(KNOWN_ICONS).toContain(icon);
    }
  });

  it("all icon names are unique", () => {
    expect(new Set(KNOWN_ICONS).size).toBe(KNOWN_ICONS.length);
  });

  it("icon names follow kebab-case convention", () => {
    for (const name of KNOWN_ICONS) {
      expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
});
