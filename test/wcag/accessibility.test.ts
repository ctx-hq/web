// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* ----------------------------------------------------------------
   Load real client.js source so tests exercise production code
   ---------------------------------------------------------------- */

const CLIENT_JS = readFileSync(
  resolve(__dirname, "../../public/static/client.js"),
  "utf-8",
);

/** Set up DOM fixture and execute the real client.js against it. */
function setupWithClientJS() {
  document.body.innerHTML = `
    <a href="#main-content" class="skip-to-main">Skip to main content</a>
    <header>
      <button id="mobile-nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav">
        Menu
      </button>
    </header>
    <nav id="mobile-nav" class="hidden">
      <a href="/">Home</a>
    </nav>
    <main id="main-content" tabindex="-1" class="outline-none">
      <p>Page content</p>
      <button data-copy="hello">Copy text</button>
    </main>
    <div id="live-region" aria-live="polite" aria-atomic="true" class="sr-only"></div>
  `;

  // Stub navigator.clipboard for happy-dom
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
    writable: true,
    configurable: true,
  });

  // Execute real client.js in the current DOM context
  // eslint-disable-next-line no-eval
  const fn = new Function(CLIENT_JS);
  fn();
}

/* ----------------------------------------------------------------
   Tests
   ---------------------------------------------------------------- */

describe("WCAG 2.4.1: Skip to main content", () => {
  beforeEach(() => setupWithClientJS());

  it("skip link points to #main-content", () => {
    const link = document.querySelector<HTMLAnchorElement>(".skip-to-main");
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("#main-content");
    expect(link!.textContent).toBe("Skip to main content");
  });

  it("main element is a valid skip target with tabindex=-1", () => {
    const main = document.getElementById("main-content");
    expect(main).not.toBeNull();
    expect(main!.tagName).toBe("MAIN");
    expect(main!.getAttribute("tabindex")).toBe("-1");
  });
});

describe("WCAG 4.1.2: Mobile menu aria-expanded", () => {
  beforeEach(() => setupWithClientJS());

  it("toggle starts with aria-expanded=false and aria-controls", () => {
    const toggle = document.getElementById("mobile-nav-toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe("mobile-nav");
    expect(toggle.getAttribute("aria-label")).toBe("Open menu");
  });

  it("clicking toggle opens nav and updates aria attributes", () => {
    const toggle = document.getElementById("mobile-nav-toggle")!;
    const nav = document.getElementById("mobile-nav")!;

    toggle.click();
    expect(nav.classList.contains("hidden")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Close menu");
  });

  it("clicking toggle again closes nav and restores aria attributes", () => {
    const toggle = document.getElementById("mobile-nav-toggle")!;
    const nav = document.getElementById("mobile-nav")!;

    toggle.click(); // open
    toggle.click(); // close
    expect(nav.classList.contains("hidden")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Open menu");
  });
});

describe("WCAG 4.1.3: Status messages (aria-live)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setupWithClientJS();
  });

  it("live-region has correct aria attributes", () => {
    const lr = document.getElementById("live-region")!;
    expect(lr.getAttribute("aria-live")).toBe("polite");
    expect(lr.getAttribute("aria-atomic")).toBe("true");
    expect(lr.textContent).toBe("");
  });

  it("copy action clears then sets live-region for screen reader re-announcement", async () => {
    const btn = document.querySelector<HTMLElement>("[data-copy]")!;
    const lr = document.getElementById("live-region")!;

    // First copy — flush the clipboard promise before advancing timers
    btn.click();
    await vi.advanceTimersByTimeAsync(50);
    expect(lr.textContent).toBe("Copied to clipboard");

    // Second copy — must clear and re-set so screen reader re-announces
    btn.click();
    await vi.advanceTimersByTimeAsync(0); // flush promise
    expect(lr.textContent).toBe(""); // cleared
    await vi.advanceTimersByTimeAsync(50);
    expect(lr.textContent).toBe("Copied to clipboard");
  });
});

describe("WCAG 2.3.3: Reduced motion", () => {
  it("globals.css contains prefers-reduced-motion rule", () => {
    const css = readFileSync(
      resolve(__dirname, "../../src/styles/globals.css"),
      "utf-8",
    );
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("animation-duration: 0.01ms");
    expect(css).toContain("transition-duration: 0.01ms");
  });
});

describe("WCAG 1.4.1: Status uses semantic tokens, not color alone", () => {
  it("alert variants pair color with border (not color-only differentiation)", () => {
    const css = readFileSync(
      resolve(__dirname, "../../src/styles/globals.css"),
      "utf-8",
    );
    for (const variant of ["destructive", "success", "warning", "info"]) {
      const match = css.match(new RegExp(`\\.cn-alert-${variant}\\s*\\{[^}]+\\}`));
      expect(match, `.cn-alert-${variant} not defined`).not.toBeNull();
      expect(match![0]).toContain("border-");
      expect(match![0]).toContain("bg-");
      expect(match![0]).toContain("text-");
    }
  });

  it("dialog destructive title uses semantic destructive token", () => {
    const css = readFileSync(
      resolve(__dirname, "../../src/styles/globals.css"),
      "utf-8",
    );
    const match = css.match(/\.cn-dialog-title-destructive\s*\{[^}]+\}/);
    expect(match).not.toBeNull();
    expect(match![0]).toContain("destructive");
  });
});
