import { describe, it, expect } from "vitest";

describe("header active state", () => {
  // Mirror the active state logic from header.tsx
  const NAV_LINKS = [
    { href: "/search", label: "Search" },
    { href: "/docs", label: "Docs" },
  ];

  function isActive(linkHref: string, currentPath: string): boolean {
    return (
      currentPath === linkHref ||
      (linkHref !== "/" && currentPath.startsWith(linkHref))
    );
  }

  it("exact match activates link", () => {
    expect(isActive("/search", "/search")).toBe(true);
    expect(isActive("/docs", "/docs")).toBe(true);
  });

  it("prefix match activates link", () => {
    expect(isActive("/docs", "/docs/api")).toBe(true);
    expect(isActive("/docs", "/docs/spec")).toBe(true);
  });

  it("non-matching path does not activate", () => {
    expect(isActive("/search", "/docs")).toBe(false);
    expect(isActive("/docs", "/search")).toBe(false);
  });

  it("home page does not activate any nav link", () => {
    for (const link of NAV_LINKS) {
      expect(isActive(link.href, "/")).toBe(false);
    }
  });

  it("package detail does not activate any nav link", () => {
    for (const link of NAV_LINKS) {
      expect(isActive(link.href, "/@hong/my-skill")).toBe(false);
    }
  });
});
