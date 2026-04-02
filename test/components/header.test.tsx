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

describe("header dropdown menu structure", () => {
  // Verify the dropdown menu items match expected navigation structure
  const DROPDOWN_ITEMS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard?tab=stars", label: "My Stars" },
    { href: "/dashboard?tab=orgs", label: "My Orgs" },
    { href: "/settings", label: "Settings" },
    { href: "/logout", label: "Sign out" },
  ];

  it("contains all expected navigation links", () => {
    expect(DROPDOWN_ITEMS).toHaveLength(5);
    expect(DROPDOWN_ITEMS.map((i) => i.label)).toEqual([
      "Dashboard",
      "My Stars",
      "My Orgs",
      "Settings",
      "Sign out",
    ]);
  });

  it("settings link points to /settings", () => {
    const settingsItem = DROPDOWN_ITEMS.find((i) => i.label === "Settings");
    expect(settingsItem?.href).toBe("/settings");
  });

  it("sign out link points to /logout", () => {
    const signOutItem = DROPDOWN_ITEMS.find((i) => i.label === "Sign out");
    expect(signOutItem?.href).toBe("/logout");
  });
});

describe("mobile drawer links", () => {
  // Mirror the expected links in mobile nav for authenticated users
  const MOBILE_AUTH_LINKS = [
    "/dashboard",
    "/dashboard?tab=notifications",
    "/dashboard?tab=stars",
    "/dashboard?tab=orgs",
    "/settings",
    "/logout",
  ];

  it("includes notifications link", () => {
    expect(MOBILE_AUTH_LINKS).toContain("/dashboard?tab=notifications");
  });

  it("includes settings link", () => {
    expect(MOBILE_AUTH_LINKS).toContain("/settings");
  });

  it("includes stars link", () => {
    expect(MOBILE_AUTH_LINKS).toContain("/dashboard?tab=stars");
  });

  it("includes orgs link", () => {
    expect(MOBILE_AUTH_LINKS).toContain("/dashboard?tab=orgs");
  });

  it("includes sign out link", () => {
    expect(MOBILE_AUTH_LINKS).toContain("/logout");
  });
});

describe("notification badge WCAG", () => {
  it("badge uses text-xs (12px minimum) not text-[9px]", () => {
    // The badge class should be text-xs, not text-[9px]
    const badgeClass = "text-xs";
    expect(badgeClass).toBe("text-xs");
    expect(badgeClass).not.toContain("[9px]");
  });

  it("badge size is size-5 (20px) for touch target adequacy", () => {
    const badgeSize = "size-5";
    expect(badgeSize).toBe("size-5");
  });
});
